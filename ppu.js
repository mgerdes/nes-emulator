var NES = NES || { };

NES.PPU = function() {
    var me = this;

    me.PPUCTRL = new Uint8Array(1);
    me.PPUMASK = new Uint8Array(1);
    me.PPUSTATUS = new Uint8Array(1);
    me.OAMADDR = new Uint8Array(1);
    me.OAMDATA = new Uint8Array(1);
    //var PPUSCROLL_X = 0;
    //var PPUSCROLL_Y = 0;
    me.PPUADDR = new Uint16Array(1);
    //var PPUDATA = 0;
    //var OAMDMA = 0;

    me.scanline = 0;

    me.addrLatch = new Uint8Array(1);
    me.addrReceivedHighByte = false;

    me.memory = new Uint8Array(0x4000);
    me.oamMemory = new Uint8Array(0x100);

    me.firstRead = true;
    me.scrollReceivedX = false; 
    me.spriteHitOccured = false;

    var UTEMP = new Uint8Array(1);
    var baseNameTableAddresses = new Uint16Array([0x2000, 0x2400, 0x2800, 0x2C00]);

    this.init = function() {
        me.PPUSTATUS[0] |= 0xA0;
    };

    this.readIO = function(address) {
        me.PPUADDR[0] = me.PPUADDR[0] & 0x3FFF;

        switch (address) {
            case 0x2002:
                var value = me.PPUSTATUS[0];
                me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 7, false);
                me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 6, false);
                me.scrollReceivedX = false;
                me.firstRead = true;
                return value;

            case 0x2007:
                var data = me.readByte(me.PPUADDR[0]);

                if (me.firstRead) {
                    me.firstRead = false;
                }
                else {
                    me.PPUADDR[0] += testBit(me.PPUCTRL[0], 2, true) ? 32 : 1;
                }

                return data;

            default:
                throw('PPU Reading from invalid address: ' + address.toString(16));
        };
    };

    this.writeIO = function(address, value) {
        me.PPUADDR[0] = me.PPUADDR[0] & 0x3FFF;

        switch (address) {
            case 0x2000:
                me.PPUCTRL[0] = value;
                break;

            case 0x2001:
                me.PPUMASK[0] = value;
                break;

            case 0x2003:
                me.OAMADDR[0] = value;
                break;

            case 0x2005:
                if (me.scrollReceivedX) {
                    //PPUSCROLL_Y = value;
                }
                else {
                    //PPUSCROLL_X = value;
                }

                me.scrollReceivedX = !me.scrollReceivedX;
                break;

            case 0x2006:
                if (me.addrReceivedHighByte) {
                    UTEMP[0] = value;
                    me.PPUADDR[0] = (me.addrLatch[0] << 8) + UTEMP[0];
                }
                else {
                    me.addrLatch[0] = value;
                }

                me.addrReceivedHighByte = !me.addrReceivedHighByte;
                me.firstRead = true;
                break;

            case 0x2007:
                if (me.firstRead) {
                    me.firstRead = false;
                }
                else {
                    me.PPUADDR[0] += (testBit(me.PPUCTRL[0], 2) ? 32 : 1);
                }

                me.writeByte(me.PPUADDR[0], value);
                break;

            default:
                throw('PPU Writing to invalid address: ' + address.toString(16));
        }
    };

    this.drawBackgroundScanline = function() {
        var tileX = testBit(me.PPUMASK[0], 1) ? 0 : 1;
        var tileY = me.scanline >> 3;

        for (; tileX < 32; tileX++) {
            var address = baseNameTableAddresses[me.PPUCTRL[0] & 0x03] + tileX + (tileY << 5);
            var tileIndex = me.readByte(address)
            var tileAddress = (testBit(me.PPUCTRL[0], 4) ? 0x1000 : 0) + (tileIndex << 4);

            var l = me.readByte(tileAddress + (me.scanline & 0x07));
            var h = me.readByte(tileAddress + (me.scanline & 0x07) + 8);

            var attributeX = tileX >> 2;
            var attributeY = tileY >> 2;

            var attributeAddress = baseNameTableAddresses[me.PPUCTRL[0] & 0x03] + 0x3C0 + attributeX + (attributeY << 3);
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

                screenSetPixel((tileX << 3) + x, me.scanline, idx); 
            }
        }
    };

    this.drawSpriteScanline = function() {
        var spriteDrawCount = 0;
        var spriteHeight = testBit(me.PPUCTRL[0], 5) ? 16 : 8;

        for (var i = 0; i < 0x100; i += 4) {
            var spriteX = me.oamReadByte(i + 3);
            var spriteY = me.oamReadByte(i);

            if (spriteY > me.scanline || spriteY + spriteHeight < me.scanline) {
                continue;
            }

            spriteDrawCount++;

            if (spriteDrawCount > 8) {
                me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 5, true);
            }

            var hflip = testBit(me.oamReadByte(i + 2), 6);
            var vflip = testBit(me.oamReadByte(i + 2), 7);

            var tileAddress = (testBit(me.PPUCTRL[0], 3) ? 0x1000 : 0);
            tileAddress += (16 * me.oamReadByte(i + 1));
            tileAddress += (vflip ? (7 - (me.scanline & 0x07)) : (me.scanline & 0x07));
            
            var l = me.readByte(tileAddress);
            var h = me.readByte(tileAddress + 8);

            var paletteAttribute = me.oamReadByte(i + 2) & 0x03;
            var paletteAddress = 0x3F10 + (paletteAttribute << 2);

            if (me.scanline == 144 && testBit(me.oamReadByte(i + 2), 5)) {
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
                screenSetPixel(spriteX + x, spriteY + (me.scanline & 0x07), idx);  

                if (testBit(me.PPUMASK[0], 3) && !me.spriteHitOccured && i == 0) {
                    me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 6, true);
                    me.spriteHitOccured = true;
                }
            }
        }
    };

    this.run = function() {
        me.scanline++;

        if (testBit(me.PPUMASK[0], 3)) {
            if (shouldDrawBackground) 
                me.drawBackgroundScanline(); 
        }

        if (testBit(me.PPUMASK[0], 4)) {
            if (shouldDrawSprites)
                me.drawSpriteScanline();
        }

        if (me.scanline == 241) {
            me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 6, false);
            me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 7, true);
            if (testBit(me.PPUCTRL[0], 7)) {
                cpu.interrupt();
            }
        }
        if (me.scanline == 262) {
            me.scanline = -1;
            me.spriteHitOccured = false;
            me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 7, false);

            updateScreen();
        }
    };

    this.oamWriteByte = function(value) {
        me.oamMemory[me.OAMADDR[0]++] = value;
    };

    this.oamReadByte = function(address) {
        return me.oamMemory[address];
    };

    this.writeByte = function(address, value) {
        if (address == 0x3F00) {
            //console.log('changed to - ', value.toString(16)); 
        }
        me.memory[address] = value;
    };

    this.readByte = function(address) {
        return me.memory[address];
    };

    this.loadChrData = function(chrData) {
        me.memory.set(chrData, 0x0000);
    };
};
