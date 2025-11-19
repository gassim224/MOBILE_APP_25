# How to Replace the Login Header Image with the Student Photo

## Quick Instructions

The student photo you provided needs to be saved as the login header image. Follow these steps:

### Step 1: Save the Student Photo

1. **Right-click** on the student photo provided in your conversation
2. **Select "Save Image As..."**
3. **Navigate** to the project folder: `assets/images/`
4. **Name** the file: `login-header.png`
5. **Click Save**

### Step 2: Verify the Image

The image should:
- Be saved at: `/workspace/assets/images/login-header.png`
- Replace the existing file (a backup exists as `login-header-old.png`)
- Be at least 480x480 pixels for best quality
- Show the student clearly with good lighting

### Step 3: Reload the App

After saving the image:
1. If the Expo server is running, it should auto-reload
2. If not, restart the app
3. You should now see the new student photo on the login screen

---

## Alternative Method (If you have the image file)

If you already have the image file saved somewhere:

```bash
# From the project root directory
cp /path/to/your/student-image.jpg assets/images/login-header.png

# Or if it's a PNG:
cp /path/to/your/student-image.png assets/images/login-header.png
```

---

## What the Login Screen Will Look Like

After replacing the image, the login screen will display:
- A circular image (240px diameter)
- Golden border around the image (#FFD700)
- Professional shadow effect
- The image will be centered above the "Bonecole" welcome text

---

## Troubleshooting

### Image doesn't show up?
1. Check the file name is exactly: `login-header.png`
2. Check the file is in: `assets/images/` folder
3. Try restarting the Expo server
4. Clear the app cache and reload

### Image looks stretched or distorted?
1. The image should be square or close to square
2. Recommended size: 480x480px or larger
3. The styling will automatically crop to fit the circular frame

### Need to revert to the old image?
```bash
# Restore the backup
cp assets/images/login-header-old.png assets/images/login-header.png
```

---

## Image Specifications

**Ideal Image Properties:**
- **Format**: PNG or JPG
- **Size**: 480x480px minimum (can be larger)
- **Aspect Ratio**: 1:1 (square)
- **File Size**: Under 2MB
- **Quality**: High resolution, well-lit, clear focus
- **Content**: Student's face and upper body, smiling, professional setting

The provided image of the student in a yellow shirt is perfect for this use case!
