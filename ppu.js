var NES = NES || { };

NES.PPU = function() {
    var me = this;

    var PPUCTRL = 0;
    var PPUMASK = 0;
    var PPUSTATUS = 0;
    var OAMADDR = 0;
    var OAMDATA = 0;
    var PPUSCROLL_X = 0;
    var PPUSCROLL_Y = 0;
    //var PPUADDR = 0;
    var PPUADDR = new Uint16Array(1);
    var PPUDATA = 0;
    var OAMDMA = 0;

    var scanline = 0;

    var addrLatch = new Uint8Array(1);
    var addrReceivedHighByte = false;

    var memory = new Uint8Array(0x4000);
    var oamMemory = new Uint8Array(0x100);

    var firstRead = true;
    var scrollReceivedX = false; 

    this.init = function() {
        PPUSTATUS |= 0xA0;
    };

    this.readIO = function(address) {
        switch (address) {
            case 0x2002:
                var value = PPUSTATUS;
                PPUSTATUS = setBit(PPUSTATUS, 7, false);
                PPUSTATUS = setBit(PPUSTATUS, 6, false);
                scrollReceivedX = false;
                firstRead = true;
                return value;

            case 0x2007:
                var data = me.readByte(PPUADDR[0]);
                //console.log('data - ' + data);

                if (firstRead) {
                    firstRead = false;
                }
                else {
                    PPUADDR[0] += testBit(PPUCTRL, 2, true) ? 32 : 1;
                }

                return data;

            default:
                throw('PPU Reading from invalid address: ' + address.toString(16));
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

            case 0x2003:
                OAMADDR = value;
                break;

            case 0x2005:
                if (scrollReceivedX) {
                    PPUSCROLL_Y = value;
                }
                else {
                    PPUSCROLL_X = value;
                }

                scrollReceivedX = !scrollReceivedX;
                break;

            case 0x2006:
                //console.log('value - ' + value.toString(16));
                //console.log('addrLatch - ' + addrLatch[0].toString(16));

                if (addrReceivedHighByte) {
                    PPUADDR[0] = (addrLatch[0] << 8) + value;
                    //console.log('PPUADDR - ' + PPUADDR[0].toString(16));
                }
                else {
                    addrLatch[0] = value;
                }

                addrReceivedHighByte = !addrReceivedHighByte;
                firstRead = true;
                break;

            case 0x2007:
                if (firstRead) {
                    firstRead = false;
                }
                else {
                    PPUADDR[0] += testBit(PPUCTRL, 2, true) ? 32 : 1;
                }

                //console.log('write - ' + PPUADDR[0].toString(16) + ', ' + value.toString(16));
                me.writeByte(PPUADDR[0], value);

                break;


            default:
                throw('PPU Writing to invalid address: ' + address.toString(16));
        }
    };

    this.run = function() {
        scanline++;

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
                cpu.interrupt();
            }
        }
        if (scanline == 262) {
            scanline = -1;
            PPUSTATUS = setBit(PPUSTATUS, 7, false);

            updateScreen();
            // Update screen
        }
    };

    this.oamWriteByte = function(value) {
        oamMemory[OAMADDR++] = value;
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
