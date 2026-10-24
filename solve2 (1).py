#!/usr/bin/env python3
"""
HTB "production" (Crypto) exploit -- v2, multiprocessing version.

Same attack as solve.py: brute-force the 1-byte RNG seed input across a
window of plausible server-start timestamps to reproduce the admin's
RSA key, then forge a JWT for HTBAdministrator1337.

This version uses multiprocessing (real parallel cores) for the CPU-
heavy RSA key generation, and only uses threads for the fast network
step. The previous threaded-only version serialized on one core
because of Python's GIL.

Usage:
    python3 solve2.py <IP> <PORT>
"""
import sys
import os
import time
import json
import hashlib
import random
import multiprocessing
from concurrent.futures import ThreadPoolExecutor, as_completed
from base64 import b64encode, b64decode
from hashlib import sha512

import requests
from Crypto.Util.number import isPrime, bytes_to_long, long_to_bytes

if len(sys.argv) != 3:
    print(f"Usage: {sys.argv[0]} <IP> <PORT>")
    sys.exit(1)

IP, PORT = sys.argv[1], sys.argv[2]
BASE = f"http://{IP}:{PORT}"
ADMIN_USERNAME = "HTBAdministrator1337"

WINDOW_SECONDS = 180   # how many seconds before "now" to search
NET_THREADS = 50       # concurrent HTTP requests per timestamp batch


def gen_prime(bits):
    while True:
        q = random.randint(2 ** (bits - 1), 2 ** bits - 1)
        p = 2 * q + 1
        if isPrime(p):
            return p


def create_key(username, byte_hex, tm):
    seed = int(hashlib.sha384(f"{byte_hex}{tm}{username}".encode()).hexdigest(), 16)
    random.seed(seed)
    p = gen_prime(512)
    q = gen_prime(512)
    n = p * q
    e = 0x10001
    phi = (p - 1) * (q - 1)
    d = pow(e, -1, phi)
    return (n, e, p, q, d, phi)


def sign(key, msg):
    n, _, _, _, d, _ = key
    h = bytes_to_long(sha512(msg).digest())
    sig = pow(h, d, n)
    return b64encode(long_to_bytes(sig))


def make_token(username, key):
    header = b64encode(json.dumps({"alg": "RSA1k24", "typ": "JWT"}).encode()).rstrip(b"=")
    payload = b64encode(json.dumps({"username": username}).encode())
    signature = sign(key, header + b"." + payload)
    return b".".join([header, payload, signature]).decode()


def gen_token_for_byte(args):
    """Runs in a worker PROCESS: pure CPU work, no network."""
    byte_val, tm = args
    byte_hex = format(byte_val, "02x")
    try:
        key = create_key(ADMIN_USERNAME, byte_hex, tm)
        token = make_token(ADMIN_USERNAME, key)
    except ValueError:
        # e=0x10001 wasn't invertible mod phi for this (wrong) candidate -- skip it.
        return None
    return byte_hex, token


def test_token(token):
    try:
        r = requests.post(
            f"{BASE}/dashboard",
            headers={"Authorization": f"Bearer: {token}"},
            timeout=10,
        )
        return r.status_code == 200, r
    except requests.RequestException:
        return False, None


def main():
    anchor = int(time.time())
    try:
        r = requests.post(f"{BASE}/register", json={"username": f"pwner_{anchor % 100000}"}, timeout=10)
        print("[*] register ->", r.status_code, r.text.strip())
    except requests.RequestException as e:
        print("[!] Could not reach server:", e)
        sys.exit(1)

    print(f"[*] Anchor time: {anchor}")
    ncpu = multiprocessing.cpu_count()
    print(f"[*] Using {ncpu} CPU cores for key generation, {NET_THREADS} threads for requests")
    print(f"[*] Searching tm in [{anchor - WINDOW_SECONDS}, {anchor}], 256 byte guesses each")

    with multiprocessing.Pool(processes=ncpu) as pool:
        for delta in range(0, WINDOW_SECONDS + 1):
            tm = anchor - delta
            tasks = [(b, tm) for b in range(256)]

            # Phase 1: generate all 256 candidate tokens for this tm in parallel across cores
            results = [r for r in pool.map(gen_token_for_byte, tasks, chunksize=4) if r is not None]

            # Phase 2: test them all concurrently over the network
            found = None
            with ThreadPoolExecutor(max_workers=NET_THREADS) as ex:
                futures = {ex.submit(test_token, token): (byte_hex, token) for byte_hex, token in results}
                for fut in as_completed(futures):
                    ok, resp = fut.result()
                    if ok:
                        byte_hex, token = futures[fut]
                        found = (byte_hex, tm, token, resp)
                        break

            if found:
                byte_hex, tm_found, token, resp = found
                print(f"\n[+] SUCCESS! byte={byte_hex} tm={tm_found}")
                print(f"[+] Response: {resp.json()}")
                return

            if delta % 10 == 0:
                print(f"[*] ... tried tm={tm} (delta={delta}), no match yet")

    print("\n[-] No match found in the search window.")
    print("[-] Increase WINDOW_SECONDS near the top of the file and rerun.")


if __name__ == "__main__":
    main()
