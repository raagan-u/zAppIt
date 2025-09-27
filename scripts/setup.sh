#!/bin/bash

# Setup script for Anonymous ZK Reddit project

echo "🚀 Setting up Anonymous ZK Reddit project..."

# Check if nargo is installed
if ! command -v nargo &> /dev/null; then
    echo "❌ Nargo not found. Please install Noir first:"
    echo "curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash"
    echo "noirup"
    exit 1
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Compile Noir circuits
echo "🔧 Compiling Noir circuits..."
cd circuits
nargo compile
if [ $? -eq 0 ]; then
    echo "✅ Circuits compiled successfully"
else
    echo "❌ Circuit compilation failed"
    exit 1
fi

# Setup React Native project
echo "📱 Setting up React Native project..."
cd ../mobile

# Initialize React Native project if it doesn't exist
if [ ! -f "package.json" ]; then
    npx react-native@latest init AnonReddit --template react-native-template-typescript
    mv AnonReddit/* .
    mv AnonReddit/.* . 2>/dev/null || true
    rmdir AnonReddit
fi

# Install Mopro dependencies
echo "📦 Installing Mopro dependencies..."
npm install @mopro-io/mopro-core
npm install @mopro-io/mopro-react-native

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. cd mobile && npm install"
echo "2. Configure Mopro in your React Native app"
echo "3. Deploy smart contracts"
echo "4. Set up IPFS storage"
