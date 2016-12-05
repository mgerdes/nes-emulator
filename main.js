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
var memoryMapper = undefined;

var frameNumber = 0;
var frame = function() {
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
        if (chrSize == 0) {
            chrData = new Uint8Array(0x2000);
        }

        var mmc = ((0xF0 & header[6]) >> 4) | ((0x0F & header[7]) << 4);
        var mirroringType = header[6] & 0x01;

        if (mmc == 0) {
            memoryMapper = new NES.Mapper0(prgData, chrData);
        }
        else if (mmc == 1) {
            memoryMapper = new NES.Mapper1(prgData, chrData);
        }
        else if (mmc == 4) {
            memoryMapper = new NES.Mapper4(prgData, chrData);
        }
        else {
            throw('Invalid Memory Mapper - ' + mmc);
        }

        if (mirroringType == 0) {
            memoryMapper.mirror = ppu.Mirror.Horizontal;
        }
        else {
            memoryMapper.mirror = ppu.Mirror.Vertical;
        }

        fileSelectorElement.style.display = 'none'; 

        console.log('mmc - ' + mmc);
        console.log('prgSize - ' + prgSize);
        console.log('chrSize - ' + chrSize);
        console.log('mirroring - ' + mirroringType);

        cpu.reset();
        ppu.init();

        setInterval(frame, 16);
    };
    reader.readAsArrayBuffer(file);
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
    }

    // Left
    if (event.keyCode == 37) {
        selectedPixelX -= 1; 
    }

    // Right
    if (event.keyCode == 39) {
        selectedPixelX += 1; 
    }

    // Down
    if (event.keyCode == 40) {
        selectedPixelY += 1; 
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
