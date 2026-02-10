# ⚠️ CRITICAL: HOW TO RUN THIS APP

## 🔴 THE PROBLEM YOU KEEP HAVING:

You keep getting this error:
```
ERROR: Cannot find native module 'ExpoVideo'
ERROR: Cannot find native module (react-native-pdf)
```

## 🎯 THE CAUSE:

**YOU ARE RUNNING THE APP THE WRONG WAY!**

---

## ✅ THE ONLY CORRECT WAY TO RUN THIS APP:

```bash
npx expo run:ios
```

**OR**

```bash
expo run:ios
```

---

## ❌ NEVER USE THESE COMMANDS:

```bash
❌ expo start
❌ npm start
❌ npm run start
❌ expo start --dev-client
```

**NEVER EVER SCAN THE QR CODE IN EXPO GO APP!**

---

## 📱 WHY THIS KEEPS HAPPENING:

### What You're Doing Wrong:
1. You run `expo start`
2. Metro bundler starts
3. You open **Expo Go app** on simulator/phone
4. You scan the QR code or press "i"
5. **Expo Go doesn't have your native modules**
6. ❌ ERROR: Cannot find native module

### What You Should Do:
1. Run `expo run:ios`
2. Xcode builds a **custom app with ALL your native modules**
3. App automatically installs on simulator
4. Metro bundler starts automatically
5. ✅ EVERYTHING WORKS!

---

## 🔍 HOW TO KNOW IF YOU'RE DOING IT RIGHT:

### ✅ Correct (expo run:ios):
- You see Xcode building
- It takes 2-5 minutes first time
- App icon appears on simulator
- App opens automatically
- **No "Expo Go" branding**
- All features work ✅

### ❌ Wrong (expo start + Expo Go):
- QR code appears in terminal
- You press "i" or scan code
- Opens in "Expo Go" app
- Expo Go logo/branding visible
- Native modules don't work ❌

---

## 🎯 SIMPLE RULE:

**This app has native modules (PDF, Video, Storage, etc.)**

**Native modules = MUST use `expo run:ios`**

**NEVER use `expo start` for this project!**

---

## 📝 STEP-BY-STEP: THE RIGHT WAY

1. Open Terminal
2. Go to project folder:
   ```bash
   cd /Users/jewele/Github/c64ffdd1-5259-4c4b-8372-08847ced7dd2
   ```
3. Run this command (and ONLY this command):
   ```bash
   expo run:ios
   ```
4. Wait 2-5 minutes for build
5. App opens on simulator ✅
6. Start developing!

---

## 🛑 IF YOU SEE THE ERROR AGAIN:

**IT MEANS YOU RAN `expo start` INSTEAD OF `expo run:ios`**

The error is NOT a code problem.
The error is NOT a configuration problem.
The error is NOT an installation problem.

**The error is: YOU'RE RUNNING THE WRONG COMMAND!**

---

## 💡 REMEMBER:

```bash
expo run:ios = ✅ Works perfectly
expo start   = ❌ NEVER USE THIS!
```

---

## 🔧 Quick Fix If Error Appears:

```bash
# 1. Kill everything
lsof -ti:8081 | xargs kill -9

# 2. Run the RIGHT command
expo run:ios
```

---

**PLEASE SAVE THIS FILE AND READ IT EVERY TIME YOU START DEVELOPMENT!**
