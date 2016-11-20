var NES = NES || { };

NES.PPU = function() {
    var me = this;

    var PPUCTRL = new Uint8Array(1);
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

    var UTEMP = new Uint8Array(1);

    var baseNameTableAddresses = new Uint16Array([0x2000, 0x2400, 0x2800, 0x2C00]);

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
                    PPUADDR[0] += testBit(PPUCTRL[0], 2, true) ? 32 : 1;
                }

                return data;

            default:
                throw('PPU Reading from invalid address: ' + address.toString(16));
        };
    };

    this.writeIO = function(address, value) {
        switch (address) {
            case 0x2000:
                PPUCTRL[0] = value;
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
                if (addrReceivedHighByte) {
                    UTEMP[0] = value;
                    PPUADDR[0] = (addrLatch[0] << 8) + UTEMP[0];
                    //console.log('SET PPUADDR - ' + PPUADDR[0].toString(16) + ', ' + addrLatch[0].toString(16) + ', ' + UTEMP[0].toString(16) + ', ' + cpu.getCount());
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
                    PPUADDR[0] += testBit(PPUCTRL[0], 2, true) ? 32 : 1;
                }

                me.writeByte(PPUADDR[0], value);
                break;

            default:
                throw('PPU Writing to invalid address: ' + address.toString(16));
        }
    };

    var drawCount1 = 0;
    var drawCount2 = 0;
    this.drawBackgroundScanline = function() {
        drawCount2 = 0;

        var tileX = testBit(PPUMASK, 1) ? 0 : 1;
        for (; tileX < 32; tileX++) {
            var tileY = scanline >> 3;
            var addr = baseNameTableAddresses[PPUCTRL & 0x03] + tileX + (tileY << 5);
            var tileIndex = me.readByte(baseNameTableAddresses[PPUCTRL & 0x03] + tileX + (tileY << 5))
            var tileAddress = (testBit(PPUCTRL, 4) ? 0x1000 : 0) + 16 * tileIndex;

            var l = me.readByte(tileAddress + (scanline & 0x07));
            var h = me.readByte(tileAddress + (scanline & 0x07) + 8);

            //console.log(drawCount1 + ', ' + drawCount2 + ', ' + tileAddress.toString(16));

            for (var x = 0; x < 8; x++) {
                var color = 0;
                color = setBit(color, 0, testBit(l, 7 - x));
                color = setBit(color, 1, testBit(h, 7 - x));

                if (color == 0) continue;

                var attributeX = tileX >> 2;
                var attributeY = tileY >> 2;

                var attributeAddress = baseNameTableAddresses[PPUCTRL & 0x03] + 0x3C0 + attributeX + (attributeY << 3);
                var attribute = me.readByte(attributeAddress);
                var square = (((tileY % 4) >> 1) << 1) + ((tileX % 4) >> 1);
                attribute = (attribute >> (2 * square)) & 0x03;
                var paletteAddress = 0x3F00 + (attribute << 2) + color;
                var idx = me.readByte(paletteAddress);

                //console.log(tileX + ', ' + tileY + ', ' + idx);

                screenSetPixel(8 * tileX + x, scanline, idx); 
            }

            drawCount2++;
        }

        drawCount1++;
    };

    this.run = function() {
        scanline++;

        if (testBit(PPUMASK, 3)) {
            me.drawBackgroundScanline(); 
        }

        if (testBit(PPUMASK, 4)) {
            //throw('Need to draw sprites');
        }

        if (scanline == 241) {
            PPUSTATUS = setBit(PPUSTATUS, 7, true);
            PPUSTATUS = setBit(PPUSTATUS, 6, false);
            if (testBit(PPUCTRL[0], 7)) {
                cpu.interrupt();
            }
        }
        if (scanline == 262) {
            scanline = -1;
            PPUSTATUS = setBit(PPUSTATUS, 7, false);

            updateScreen();
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

    this.loadChrData = function(chrData) {
        memory.set(chrData, 0x0000);
    };
};
