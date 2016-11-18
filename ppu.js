var NES = NES || { };

NES.PPU = function() {
    var me = this;

    var PPUCTRL = 0;
    var PPUMASK = 0;
    var PPUSTATUS = 0;
    var OAMADDR = 0;
    var OAMDATA = 0;
    var PPUSCROLL = 0;
    var PPUADDR = 0;
    var PPUDATA = 0;
    var OAMDMA = 0;

    var scanline = 0;

    var memory = new Uint8Array(0x4000);

    this.init = function() {
        PPUSTATUS |= 0xA0;
    };

    this.readIO = function(address) {
        switch (address) {
            case 0x2002:
                var value = PPUSTATUS;
                PPUSTATUS = setBit(PPUSTATUS, 7, false);
                PPUSTATUS = setBit(PPUSTATUS, 6, false);
                return value;
                break;
        };
    };

    this.writeIO = function(address, value) {
        switch (address) {
            case 0x2000:
                PPUCTRL = value;
                break;

            case 0x2001:
                PPUMASK = value;
                break;

            default:
                console.log('PPU Writing to invalid address: ' + address);
        }
    };

    this.run = function() {
        scanline++;

        console.log('scanline: ' + scanline);

        if (testBit(PPUMASK, 3)) {
            throw('Need to draw background');
        }

        if (testBit(PPUMASK, 4)) {
            throw('Need to draw sprites');
        }

        if (scanline == 241) {
            PPUSTATUS = setBit(PPUSTATUS, 7, true);
            PPUSTATUS = setBit(PPUSTATUS, 6, false);
            if (testBit(PPUCTRL, 7)) {
                cpu.interupt();
            }
        }
        if (scanline == 262) {
            scanline = -1;
            PPUSTATUS = setBit(PPUSTATUS, 7, false);

            updateScreen();
            // Update screen
        }
    };

    this.writeByte = function(address, value) {
        memory[address] = value;
    };

    this.readByte = function(address) {
        return memory[address];
    };

    this.readWord = function(address) {
        return memory[address] | memory[address + 1] << 8;
    };

    this.loadChrData = function(chrData) {
        memory.set(chrData, 0x0000);
    };
};
