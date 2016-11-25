var NES = NES || { };

var shouldDrawSprites = true;
var shouldDrawBackground = true;

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
    //console.log('frame - ' + frameNumber++);

    var startTime = new Date();

    for (var i = 0; i < 263; i++) {
        ppu.run();
        cpu.run(Math.floor(1364 / 12));
    }

    var endTime = new Date();

    var elapsedTime = endTime.getTime() - startTime.getTime();

    if (elapsedTime > 16) {
        //console.log(endTime.getTime() - startTime.getTime());
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

        console.log(header[4] + ', ' + header[5]);

        if (header[4] == 1) {
            cpu.setMemory(0x8000, prgData);
            cpu.setMemory(0xC000, prgData);
        }
        else {
            cpu.setMemory(0x8000, prgData);
        }

        if (header[5] == 0) {

        }
        else if (header[5] == 1) {
            ppu.loadChrData(chrData);
        }
        else {
            throw('lawl too many chr datas');
        }

        cpu.reset();
        ppu.init();

        setInterval(frame, 17);
    };
    reader.readAsArrayBuffer(file);
};

var saveState = function() {
    console.log(cpu);
    console.log(ppu);
};

var fileSelectorElement = document.getElementById('rom-file-selector');

fileSelectorElement.onchange = function() {
    initRom(fileSelectorElement.files[0]);
};

document.onkeydown = function(event) {
    // K, A
    if (event.keyCode == 75) {
        controller.setKeyDown(1);
    }

    // J, B
    if (event.keyCode == 74) {
        controller.setKeyDown(2);
    }

    // U, SELECT
    if (event.keyCode == 85) {
        controller.setKeyDown(3);
    }

    // I, START
    if (event.keyCode == 73) {
        controller.setKeyDown(4);
    }

    // W, UP
    if (event.keyCode == 87) {
        controller.setKeyDown(5);
    }

    // S, DOWN
    if (event.keyCode == 83) {
        controller.setKeyDown(6);
    }

    // A, LEFT
    if (event.keyCode == 65) {
        controller.setKeyDown(7);
    }

    // D, RIGHT
    if (event.keyCode == 68) {
        controller.setKeyDown(8);
    }

    // Up
    if (event.keyCode == 38) {
        selectedPixelY -= 1; 
        //console.log(selectedPixelX + ', ' + selectedPixelY);
    }

    // Left
    if (event.keyCode == 37) {
        selectedPixelX -= 1; 
        //console.log(selectedPixelX + ', ' + selectedPixelY);
    }

    // Right
    if (event.keyCode == 39) {
        selectedPixelX += 1; 
        //console.log(selectedPixelX + ', ' + selectedPixelY);
    }

    // Down
    if (event.keyCode == 40) {
        selectedPixelY += 1; 
        //console.log(selectedPixelX + ', ' + selectedPixelY);
    }
};

document.onkeyup = function(event) {
    // K, A
    if (event.keyCode == 75) {
        controller.setKeyUp(1);
    }

    // J, B
    if (event.keyCode == 74) {
        controller.setKeyUp(2);
    }

    // U, SELECT
    if (event.keyCode == 85) {
        controller.setKeyUp(3);
    }

    // I, START
    if (event.keyCode == 73) {
        controller.setKeyUp(4);
    }

    // W, UP
    if (event.keyCode == 87) {
        controller.setKeyUp(5);
    }

    // S, DOWN
    if (event.keyCode == 83) {
        controller.setKeyUp(6);
    }

    // A, LEFT
    if (event.keyCode == 65) {
        controller.setKeyUp(7);
    }

    // D, RIGHT
    if (event.keyCode == 68) {
        controller.setKeyUp(8);
    }

    // Left
    if (event.keyCode == 37) {
        shouldDrawBackground = !shouldDrawBackground;
    }

    // Right
    if (event.keyCode == 39) {
        shouldDrawSprites = !shouldDrawSprites;
    }
};

