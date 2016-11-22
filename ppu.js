var NES = NES || { };

NES.PPU = function() {
    var me = this;

    var PPUCTRL = new Uint8Array(1);
    var PPUMASK = new Uint8Array(1);
    var PPUSTATUS = new Uint8Array(1);
    var OAMADDR = 0;
    var OAMDATA = 0;
    var PPUSCROLL_X = 0;
    var PPUSCROLL_Y = 0;
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
        PPUSTATUS[0] |= 0xA0;
    };

    this.readIO = function(address) {
        PPUADDR[0] = PPUADDR[0] & 0x3FFF;

        switch (address) {
            case 0x2002:
                var value = PPUSTATUS[0];
                PPUSTATUS[0] = setBit(PPUSTATUS[0], 7, false);
                PPUSTATUS[0] = setBit(PPUSTATUS[0], 6, false);
                scrollReceivedX = false;
                firstRead = true;
                return value;

            case 0x2007:
                var data = me.readByte(PPUADDR[0]);

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
        PPUADDR[0] = PPUADDR[0] & 0x3FFF;

        switch (address) {
            case 0x2000:
                PPUCTRL[0] = value;
                break;

            case 0x2001:
                PPUMASK[0] = value;
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
                    PPUADDR[0] += (testBit(PPUCTRL[0], 2) ? 32 : 1);
                }

                me.writeByte(PPUADDR[0], value);
                break;

            default:
                throw('PPU Writing to invalid address: ' + address.toString(16));
        }
    };

    this.drawBackgroundScanline = function() {
        var tileX = testBit(PPUMASK[0], 1) ? 0 : 1;
        var tileY = scanline >> 3;

        for (; tileX < 32; tileX++) {
            var address = baseNameTableAddresses[PPUCTRL[0] & 0x03] + tileX + (tileY << 5);
            var tileIndex = me.readByte(address)
            var tileAddress = (testBit(PPUCTRL[0], 4) ? 0x1000 : 0) + (tileIndex << 4);

            var l = me.readByte(tileAddress + (scanline & 0x07));
            var h = me.readByte(tileAddress + (scanline & 0x07) + 8);

            var attributeX = tileX >> 2;
            var attributeY = tileY >> 2;

            var attributeAddress = baseNameTableAddresses[PPUCTRL[0] & 0x03] + 0x3C0 + attributeX + (attributeY << 3);
            var attribute = me.readByte(attributeAddress);
            var square = (((tileY % 4) >> 1) << 1) + ((tileX % 4) >> 1);
            attribute = (attribute >> (square << 1)) & 0x03;
            attribute = attribute << 2;


            for (var x = 0; x < 8; x++) {
                var color = 0;
                color = setBit(color, 0, testBit(l, 7 - x));
                color = setBit(color, 1, testBit(h, 7 - x));

                if (color == 0) continue;

                var paletteAddress = 0x3F00 + attribute + color;
                var idx = me.readByte(paletteAddress);

                screenSetPixel((tileX << 3) + x, scanline, idx); 
            }
        }
    };

    this.drawSpriteScanline = function() {
        var spriteDrawCount = 0;
        var spriteHeight = testBit(PPUCTRL[0], 5) ? 16 : 8;

        for (var i = 0; i < 0x100; i += 4) {
            var spriteX = me.oamReadByte(i + 3);
            var spriteY = me.oamReadByte(i);

            if (spriteY > scanline || spriteY + spriteHeight < scanline) {
                continue;
            }

            spriteDrawCount++;

            if (spriteDrawCount > 8) {
                PPUSTATUS[0] = setBit(PPUSTATUS[0], 5, true);
            }

            var hflip = testBit(me.oamReadByte(i + 2), 6);
            var vflip = testBit(me.oamReadByte(i + 2), 7);

            var tileAddress = (testBit(PPUCTRL[0], 3) ? 0x1000 : 0);
            tileAddress += (16 * me.oamReadByte(i + 1));
            tileAddress += (vflip ? (7 - (scanline & 0x07)) : (scanline & 0x07));
            
            var l = me.readByte(tileAddress);
            var h = me.readByte(tileAddress + 8);

            var paletteAttribute = me.oamReadByte(i + 2) & 0x03;
            var paletteAddress = 0x3F10 + (paletteAttribute << 2);

            if (scanline == 144 && testBit(me.oamReadByte(i + 2), 5)) {
                //console.log('yes');
            }
            else {
                //console.log('no');
            }

            for (var x = 0; x < 8; x++) {
                var color = 0;

                if (!hflip) {
                    color = setBit(color, 0, testBit(l, 7 - x));
                    color = setBit(color, 1, testBit(h, 7 - x));
                }
                else {
                    color = setBit(color, 0, testBit(l, x));
                    color = setBit(color, 1, testBit(h, x));
                }

                if (color == 0) continue;

                var idx = me.readByte(paletteAddress + color);

                screenSetPixel(spriteX + x, spriteY + (scanline & 0x07), idx);  
            }
        }
    };

    this.run = function() {
        scanline++;

        if (testBit(PPUMASK[0], 3)) {
            if (shouldDrawBackground) 
                me.drawBackgroundScanline(); 
        }

        if (testBit(PPUMASK[0], 4)) {
            if (shouldDrawSprites)
                me.drawSpriteScanline();
        }

        if (scanline == 241) {
            PPUSTATUS[0] = setBit(PPUSTATUS[0], 7, true);
            PPUSTATUS[0] = setBit(PPUSTATUS[0], 6, false);
            if (testBit(PPUCTRL[0], 7)) {
                cpu.interrupt();
            }
        }
        if (scanline == 262) {
            scanline = -1;
            PPUSTATUS[0] = setBit(PPUSTATUS[0], 7, false);

            updateScreen();
        }
    };

    this.oamWriteByte = function(value) {
        oamMemory[OAMADDR++] = value;
    };

    this.oamReadByte = function(address) {
        return oamMemory[address];
    };

    this.writeByte = function(address, value) {
        if (address == 0x3F00) {
            //console.log(cpu.publicPC[0].toString(16));
            //console.log('changed to - ', value.toString(16)); 
        }
        memory[address] = value;
    };

    this.readByte = function(address) {
        return memory[address];
    };

    this.loadChrData = function(chrData) {
        memory.set(chrData, 0x0000);
    };
};
