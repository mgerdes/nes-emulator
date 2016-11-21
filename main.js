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

var controller = new NES.Controller();
var cpu = new NES.CPU();
var ppu = new NES.PPU();

var frameNumber = 0;
var frame = function() {
    //if (frameNumber > 100) return;

    //console.log('frame - ' + frameNumber++);

    var startTime = new Date();

    for (var i = 0; i < 262; i++) {
        ppu.run();
        cpu.run(Math.floor(1364 / 12));
    }

    var endTime = new Date();

    var elapsedTime = endTime.getTime() - startTime.getTime();

    //if (elapsedTime > 16) {
    //console.log(endTime.getTime() - startTime.getTime());
    //}
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

        setInterval(frame, 17);
    };
    reader.readAsArrayBuffer(file);
};

var fileSelectorElement = document.getElementById('rom-file-selector');

fileSelectorElement.onchange = function() {
    initRom(fileSelectorElement.files[0]);
};
