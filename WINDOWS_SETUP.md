# 🪟 Windows 11 Installation Guide - Gemini CLI with Anthropic

## 📋 **Prerequisites**

1. **Windows 11** (should work on Windows 10 too)
2. **Node.js v20+** - Download from [nodejs.org](https://nodejs.org/)
3. **Git** - Download from [git-scm.com](https://git-scm.com/)
4. **AWS Account** with Bedrock access
5. **Command Prompt** or **PowerShell** (run as Administrator recommended)

## 🚀 **Quick Installation (3 Methods)**

### **Method 1: Download Ready-Made Package**
If you have access to the modified code:

1. **Download** the entire project folder to your Windows machine
2. **Extract** to `C:\gemini-cli` (or any folder you prefer)
3. **Open Command Prompt** in that folder
4. **Run**: `windows-install.bat`
5. **Run**: `setup-anthropic.bat`

### **Method 2: Clone and Modify**
If starting from GitHub:

1. **Clone the repository**:
   ```cmd
   git clone https://github.com/google-gemini/gemini-cli.git
   cd gemini-cli
   ```

2. **Apply modifications** (copy the new files I created):
   - Copy `anthropicContentGenerator.ts` to `packages/core/src/core/`
   - Copy `anthropicModels.ts` to `packages/core/src/config/`
   - Copy `anthropic.ts` to `packages/cli/src/commands/`
   - Update `contentGenerator.ts` with Anthropic support

3. **Update package.json**:
   ```cmd
   cd packages/core
   npm install @aws-sdk/client-bedrock-runtime @aws-sdk/credential-providers
   cd ../..
   ```

4. **Run installation**:
   ```cmd
   windows-install.bat
   setup-anthropic.bat
   ```

### **Method 3: Manual Step-by-Step**

1. **Install Node.js**:
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose "LTS" version
   - Run installer, check "Add to PATH"

2. **Verify installation**:
   ```cmd
   node --version
   npm --version
   ```

3. **Clone repository**:
   ```cmd
   git clone https://github.com/google-gemini/gemini-cli.git
   cd gemini-cli
   ```

4. **Install dependencies**:
   ```cmd
   npm install
   ```

5. **Add AWS SDK** (in packages/core):
   ```cmd
   cd packages/core
   npm install @aws-sdk/client-bedrock-runtime @aws-sdk/credential-providers
   cd ../..
   ```

6. **Build project**:
   ```cmd
   npm run build
   ```

## ⚙️ **Configuration**

### **Set AWS Credentials**
Choose one method:

**Option A: Use the setup script**
```cmd
setup-anthropic.bat
```

**Option B: Manual environment variables**
```cmd
set AWS_ACCESS_KEY_ID=your-access-key-id
set AWS_SECRET_ACCESS_KEY=your-secret-access-key
set AWS_SESSION_TOKEN=your-session-token
set AWS_REGION=us-east-1
set ANTHROPIC_MODEL=claude-3.5-sonnet
set GEMINI_AUTH_TYPE=anthropic-bedrock
```

**Option C: Permanent system variables**
1. Right-click "This PC" → Properties
2. Advanced system settings → Environment Variables
3. Add the variables under "System variables"

### **Available Models**
- `claude-3.5-sonnet` - Best for coding (recommended)
- `claude-3.5-haiku` - Fast and cheap
- `claude-3-opus` - Most capable for analysis
- `claude-3-sonnet` - Balanced
- `claude-3-haiku` - Lightweight

## 🧪 **Testing Your Setup**

1. **Validate environment**:
   ```cmd
   npm run start -- anthropic --validate
   ```

2. **List available models**:
   ```cmd
   npm run start -- anthropic --list-models
   ```

3. **Test a simple query**:
   ```cmd
   npm run start
   ```
   Then type: "Hello, tell me about yourself"

## 🔧 **Troubleshooting**

### **Common Issues**

**❌ "node is not recognized"**
```
Solution: Reinstall Node.js and check "Add to PATH"
```

**❌ "npm install fails"**
```cmd
npm cache clean --force
npm install
```

**❌ "Access denied" errors**
```cmd
# Run Command Prompt as Administrator
```

**❌ "AWS credentials not found"**
```
Solution: Run setup-anthropic.bat or set environment variables
```

**❌ "Build fails"**
```cmd
# Delete node_modules and reinstall
rmdir /s node_modules
npm install
npm run build
```

### **Verify Installation**
```cmd
# Check Node.js
node --version

# Check npm
npm --version

# Check AWS credentials
echo %AWS_ACCESS_KEY_ID%

# Test the CLI
npm run start -- anthropic --show-config
```

## 📁 **File Structure After Installation**

```
C:\gemini-cli\
├── packages\
│   ├── core\
│   │   ├── src\
│   │   │   ├── core\
│   │   │   │   ├── anthropicContentGenerator.ts  ← New
│   │   │   │   └── contentGenerator.ts           ← Modified
│   │   │   └── config\
│   │   │       └── anthropicModels.ts            ← New
│   │   └── package.json                          ← Modified
│   └── cli\
│       └── src\
│           └── commands\
│               └── anthropic.ts                  ← New
├── windows-install.bat                           ← Installation script
├── setup-anthropic.bat                          ← Configuration script
├── set-env.bat                                   ← Generated env vars
└── ANTHROPIC_SETUP.md                           ← Documentation
```

## 🎯 **Quick Start Commands**

After installation:

```cmd
# Set environment (run once per session)
set-env.bat

# Validate setup
npm run start -- anthropic --validate

# Start coding session
npm run start

# Get model recommendations
npm run start -- anthropic --recommend coding

# Switch models
set ANTHROPIC_MODEL=claude-3.5-haiku
npm run start
```

## 💡 **Pro Tips**

1. **Add to PATH**: Add the gemini-cli folder to your system PATH for global access
2. **PowerShell**: Works better than Command Prompt for some operations
3. **Environment**: Create a `gemini-env.bat` file to quickly load settings
4. **Updates**: Use `git pull` to get updates, then `npm run build`
5. **Multiple Models**: Switch models per session with environment variables

## 🔗 **Quick Links**
- [Node.js Download](https://nodejs.org/)
- [Git Download](https://git-scm.com/)
- [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
- [Original Gemini CLI](https://github.com/google-gemini/gemini-cli)

Your Windows 11 setup should now be ready to use Anthropic's Claude models! 🎉