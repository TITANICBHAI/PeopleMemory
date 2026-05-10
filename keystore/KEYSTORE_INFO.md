# People Memory — Android Keystore Details

> **IMPORTANT:** Keep this file and the keystore files private.
> The `.jks` and `.keystore` files are gitignored and will NOT be pushed to GitHub.
> Back them up somewhere safe (cloud storage, password manager, etc.).

---

## Files Generated

| File | Format | Use |
|------|--------|-----|
| `peoplememory.jks` | Java KeyStore (JKS) | Standard Java keystore format |
| `peoplememory.keystore` | Android Keystore | Identical content, alternate extension expected by some tools |

Both files are **identical** — same key, same certificate, just different extensions.

---

## Keystore Credentials

| Field | Value |
|-------|-------|
| **Store password** | `TBTechs@2024!` |
| **Key password** | `TBTechs@2024!` |
| **Alias** | `peoplememory` |
| **Key algorithm** | RSA 2048-bit |
| **Signature** | SHA256withRSA |
| **Validity** | 10,000 days (until ~Sep 2053) |

---

## Certificate Details

| Field | Value |
|-------|-------|
| **CN** (Common Name) | People Memory |
| **OU** (Org Unit) | TBTechs |
| **O** (Organization) | TBTechs |
| **L** (City) | Unknown |
| **ST** (State) | Unknown |
| **C** (Country) | IN |
| **Serial number** | f69b928a7db0a2b9 |
| **Created** | May 10, 2026 |
| **Expires** | Sep 25, 2053 |

---

## Certificate Fingerprints

```
SHA-1:   AA:DA:09:40:28:EC:6F:09:E1:20:8F:43:A8:F9:64:DE:65:44:DD:92
SHA-256: 8F:BA:13:F6:DE:64:C8:BE:FF:1E:FB:38:74:FF:4A:47:D6:EA:C5:EA:26:D0:4E:6A:A0:39:95:0A:7B:A7:41:40
```

> The **SHA-1** fingerprint is needed for Google Play Console app signing.
> The **SHA-256** fingerprint is used for Google Sign-In / Firebase (if ever added).

---

## App Build Info (at time of keystore creation)

| Field | Value |
|-------|-------|
| **App name** | People Memory |
| **Bundle ID** | com.peoplememory.app |
| **Version** | 2.0.0 |
| **iOS build number** | 2 |
| **Android versionCode** | 5 |

---

## How to Use with EAS

Add to `eas.json` under your production profile:

```json
"production": {
  "android": {
    "buildType": "app-bundle",
    "credentialsSource": "local"
  }
}
```

Then create `artifacts/people-mobile/credentials.json`:

```json
{
  "android": {
    "keystore": {
      "keystorePath": "../../keystore/peoplememory.keystore",
      "keystorePassword": "TBTechs@2024!",
      "keyAlias": "peoplememory",
      "keyPassword": "TBTechs@2024!"
    }
  }
}
```

---

## How to Use with Local Gradle (if ever needed)

In `android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=../../keystore/peoplememory.keystore
MYAPP_UPLOAD_KEY_ALIAS=peoplememory
MYAPP_UPLOAD_STORE_PASSWORD=TBTechs@2024!
MYAPP_UPLOAD_KEY_PASSWORD=TBTechs@2024!
```

---

## Verify Keystore Anytime

```bash
keytool -list -v \
  -keystore keystore/peoplememory.jks \
  -storepass 'TBTechs@2024!'
```
