const { build } = require('esbuild');

// Automatically exclude all node_modules from the bundled version
const { nodeExternalsPlugin } = require('esbuild-node-externals');

build(
    {
        entryPoints: [
            './src/index.js'
        ],
        outfile: 'lib/index.js',
        bundle: true,
        minify: true,
        platform: 'node',
        sourcemap: true,
        plugins: [
            nodeExternalsPlugin()
        ]
    }
);