#!/usr/bin/env python3
"""
HTB "production" (Crypto) exploit.

Vulnerability: crypto/rsa.py seeds Python's random module with
    sha384(f'{os.urandom(1).hex()}{tm}{username}')
Only os.urandom(1) (256 possibilities) and tm (server start time, in
whole seconds) are secret -- the admin username 'HTBAdministrator1337'
is public. Because key generation is fully deterministic from that
seed, we can re-derive the admin's exact RSA key by brute-forcing the
256 byte values across a small window of plausible timestamps, then
forge a valid signed JWT for the admin account.

Usage:
    python3 solve.py <IP> <PORT>

Run this IMMEDIATELY after you spawn the instance -- the closer your
machine's clock is to the container's actual start time, the smaller
the timestamp window needs to be, and the faster this finds the key.
"""
import sys
import time
import json
import hashlib
import random
import threading
import queue
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

# How far back (in seconds) before "now" to search for the server's
# actual startup timestamp. Widen this if the first pass finds nothing
# (e.g. if there was a long delay between instance spawn and running
# this script).
WINDOW_SECONDS = 120
THREADS = 40


# ---- replica of the vulnerable crypto code (byte/tm are parameters
#      instead of being pulled from os.urandom()/time.time()) ----

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


def try_dashboard(token):
    headers = {"Authorization": f"Bearer: {token}"}
    r = requests.post(f"{BASE}/dashboard", headers=headers, timeout=10)
    return r


def worker(task_q, result_holder, stop_event):
    while not stop_event.is_set():
        try:
            byte_val, tm = task_q.get_nowait()
        except queue.Empty:
            return
        byte_hex = format(byte_val, "02x")
        key = create_key(ADMIN_USERNAME, byte_hex, tm)
        token = make_token(ADMIN_USERNAME, key)
        try:
            r = try_dashboard(token)
        except requests.RequestException:
            continue
        if r.status_code == 200:
            result_holder["flag_response"] = r.json()
            result_holder["byte_hex"] = byte_hex
            result_holder["tm"] = tm
            stop_event.set()
            return


def main():
    # Step 1: register a throwaway user. This warms the connection and
    # gives us a "now" anchored to (roughly) the server's clock.
    anchor = int(time.time())
    try:
        r = requests.post(
            f"{BASE}/register",
            json={"username": "pwner_1234"},
            timeout=10,
        )
        print("[*] register ->", r.status_code, r.text.strip())
    except requests.RequestException as e:
        print("[!] Could not reach server:", e)
        sys.exit(1)

    print(f"[*] Anchor time: {anchor}")
    print(f"[*] Brute-forcing byte(256) x tm(last {WINDOW_SECONDS}s) with {THREADS} threads...")

    task_q = queue.Queue()
    # Most likely candidates first: timestamps closest to "now" going
    # backwards (the container almost certainly started before we
    # could connect to it, never after).
    for delta in range(0, WINDOW_SECONDS + 1):
        tm = anchor - delta
        for byte_val in range(256):
            task_q.put((byte_val, tm))

    result_holder = {}
    stop_event = threading.Event()

    threads = [
        threading.Thread(target=worker, args=(task_q, result_holder, stop_event))
        for _ in range(THREADS)
    ]
    t0 = time.time()
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    elapsed = time.time() - t0

    if "flag_response" in result_holder:
        print(f"\n[+] SUCCESS in {elapsed:.1f}s")
        print(f"[+] byte={result_holder['byte_hex']} tm={result_holder['tm']}")
        print(f"[+] Response: {result_holder['flag_response']}")
    else:
        print(f"\n[-] No match found in {elapsed:.1f}s within the search window.")
        print("[-] Try increasing WINDOW_SECONDS and re-running (the admin key")
        print("    was generated earlier than we guessed).")


if __name__ == "__main__":
    main()
