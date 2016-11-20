var NES = NES || { };

var testBit = function(value, bit) {
    return (value & (1 << bit)) != 0;
};

var setBit = function(value, bit, on) {
    if (on) {
        return value |= (1 << bit);
    }
    else {
        return value &= ~(1 << bit);
    }
};

var cpu = new NES.CPU();
var ppu = new NES.PPU();

var frameNumber = 0;
var frame = function() {
    console.log('frame - ' + frameNumber++);

    for (var i = 0; i < 262; i++) {
        ppu.run();
        cpu.run(Math.floor(1364 / 12));
    }
};

var initRom = function(file) {
    var reader = new FileReader();
    reader.onloadend = function() {
        var header = new Uint8Array(reader.result, 0, 16);

        var prgSize = 16384 * header[4];
        var chrSize = 8192 * header[5];

        var prgData = new Uint8Array(reader.result, 16, prgSize);
        var chrData = new Uint8Array(reader.result, 16 + prgSize, chrSize);

        cpu.loadPrgData(prgData);
        ppu.loadChrData(chrData);

        cpu.reset();
        ppu.init();

        setInterval(frame, 16);

        for (var j = 0; j < 60; j++) {

        }

        console.log('finished');
    };
    reader.readAsArrayBuffer(file);
};

var fileSelectorElement = document.getElementById('rom-file-selector');

fileSelectorElement.onchange = function() {
    initRom(fileSelectorElement.files[0]);
};
