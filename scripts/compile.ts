import fs from 'fs';
import path from 'path';
// @ts-ignore
import solc from 'solc';

function compile() {
  const contractPath = path.resolve(__dirname, '../contracts/NongolEvent.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'NongolEvent.sol': {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  };

  console.log('Compiling contracts/NongolEvent.sol with solc...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasError = false;
    for (const error of output.errors) {
      if (error.severity === 'error') {
        console.error('Compiler Error:', error.formattedMessage);
        hasError = true;
      } else {
        console.warn('Compiler Warning:', error.formattedMessage);
      }
    }
    if (hasError) process.exit(1);
  }

  const contract = output.contracts['NongolEvent.sol']['NongolEvent'];
  const bytecode = contract.evm.bytecode.object;
  const abi = contract.abi;

  const buildDir = path.resolve(__dirname, '../build');
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

  fs.writeFileSync(
    path.join(buildDir, 'NongolEvent.json'),
    JSON.stringify({ abi, bytecode: `0x${bytecode}` }, null, 2)
  );

  console.log('✓ Compilation successful!');
  console.log(`Bytecode length: ${bytecode.length / 2} bytes`);
  console.log(`Artifact saved to build/NongolEvent.json`);
}

compile();
