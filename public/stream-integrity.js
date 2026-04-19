self.onmessage = function(e) {
    const intensity = e.data.intensity || 0.05;
    function run() {
        const s = performance.now();
        while (performance.now() - s < (intensity * 100)) {
            Math.sqrt(Math.random());
        }
        setTimeout(run, 100 * (1 - intensity));
    }
    run();
};
