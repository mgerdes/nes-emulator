var NES = NES || { };

NES.PPU = function() {
    var me = this;

    me.PPUCTRL = new Uint8Array(1);
    me.PPUMASK = new Uint8Array(1);
    me.PPUSTATUS = new Uint8Array(1);
    me.OAMADDR = new Uint8Array(1);
    me.OAMDATA = new Uint8Array(1);
    me.PPUSCROLL_X = new Uint8Array(1);;
    //var PPUSCROLL_Y = 0;
    me.PPUADDR = new Uint16Array(1);
    //var PPUDATA = 0;
    //var OAMDMA = 0;

    me.t = 0;
    me.w = 0;
    me.v = 0;
    me.x = 0;

    me.scanline = 0;

    me.addrLatch = new Uint8Array(1);
    me.addrReceivedHighByte = false;

    me.memory = new Uint8Array(0x4000);
    me.oamMemory = new Uint8Array(0x100);

    me.firstRead = true;
    me.scrollReceivedX = false; 
    me.spriteHitOccured = false;

    me.screenBackground = new Array(528);
    for (x = 0; x < 528; x++) {
        me.screenBackground[x] = new Array(248);
    }

    me.chrData = undefined;

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
                me.w = 0;
                me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 7, false);
                me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 6, false);
                me.scrollReceivedX = false;
                me.firstRead = true;
                return value;

            case 0x2007:
                var data = me.readByte(me.PPUADDR[0]);

                me.v += (testBit(me.PPUCTRL[0], 2) ? 32 : 1);

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

        value = value & 0xFF;

        switch (address) {
            case 0x2000:
                me.t = (me.t & 0xF3FF) | ((value & 0x03) << 10);
                me.PPUCTRL[0] = value;
                break;

            case 0x2001:
                me.PPUMASK[0] = value;
                break;

            case 0x2003:
                me.OAMADDR[0] = value;
                break;

            case 0x2005:
                if (me.w == 0) {
                    me.t = (me.t & 0xFFE0) | ((value & 0xF8) >> 3);
                    me.x = value & 0x0007; 
                    me.w = 1;
                }
                else {
                    me.t = (me.t & 0x8FFF) | ((value & 0x07) << 12);
                    me.t = (me.t & 0xFC1F) | ((value & 0xF8) << 2);
                    me.w = 0;
                }

                if (me.scrollReceivedX) {
                    //PPUSCROLL_Y = value;
                }
                else {
                    me.PPUSCROLL_X[0] = value;
                }

                me.scrollReceivedX = !me.scrollReceivedX;
                break;

            case 0x2006:
                if (me.w == 0) {
                    me.t = (me.t & 0x80FF) | ((value & 0x3F) << 8);
                    me.w = 1;
                }
                else {
                    me.t = (me.t & 0xFF00) | value;
                    me.v = me.t;
                    me.w = 0;
                }

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
                me.v += (testBit(me.PPUCTRL[0], 2) ? 32 : 1);

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

    me.tileData1 = new Array(8);
    me.tileData2 = new Array(8);

    this.updateTileData = function() {
        var tileIndex = me.readByte(0x2000 | (me.v & 0x0FFF));
        var tileAddress = (testBit(me.PPUCTRL[0], 4) ? 0x1000 : 0) | (tileIndex << 4);
        var fineY = (ppu.v >> 12) & 0x07;
        var l = me.readByte(tileAddress + fineY);
        var h = me.readByte(tileAddress + fineY + 8);

        var attributeAddress = 0x23C0 | (me.v & 0x0C00) | ((me.v >> 4) & 0x38) | ((me.v >> 2) & 0x07);
        var shift = ((me.v >> 4) & 4) | (me.v & 2);
        var attribute = ((me.readByte(attributeAddress) >> shift) & 3) << 2;

        for (var i = 0; i < 8; i++) {
            me.tileData1[i] = me.tileData2[i];
            me.tileData2[i] = 0;

            me.tileData2[i] = setBit(me.tileData2[i], 0, testBit(l, 7 - i));
            me.tileData2[i] = setBit(me.tileData2[i], 1, testBit(h, 7 - i));
            me.tileData2[i] = me.tileData2[i] | attribute;
        }
    };

    this.copyX = function() {
        me.v = (me.v & 0xFBE0) | (me.t & 0x041F)
    };

    this.incrementX = function() {
        if ((me.v & 0x001F) == 0x1F) {
            me.v = me.v & 0xFFE0
            me.v = me.v ^ 0x0400
        } else {
            me.v += 1;
        }
    };

    this.incrementY = function() {
        if ((me.v & 0x7000) != 0x7000) { 
            me.v += 0x1000;           
        }
        else {
            me.v &= 0x8FFF;
            var y = (me.v & 0x03E0) >> 5;
            if (y == 29) {
                y = 0;
                me.v ^= 0x0800;
            }
            else if (y == 31) {
                y = 0;
            }
            else {
                y += 1;
            }
            me.v = (me.v & 0xFC1F) | (y << 5);
        }
    };

    this.drawBackgroundScanline = function() {
        me.copyX();
        me.updateTileData();

        for (i = 0; i < 32; i++) {
            me.incrementX();
            me.updateTileData();

            for (j = 0; j < 8; j++) {
                var color = 0;

                if (me.x + j < 8) {
                    color = me.tileData1[me.x + j];
                }
                else {
                    color = me.tileData2[(me.x + j) % 8];
                }

                if ((color & 0x03) != 0) {
                    var paletteAddress = 0x3F00 + color;
                    var idx = me.readByte(paletteAddress);
                    screenSetPixel(i * 8 + j, me.scanline, idx); 
                    me.screenBackground[i * 8 + j][me.scanline] = (color & 0x3);
                }
            }
        }
        me.incrementY();
    };

    this.drawSpriteScanline = function() {
        var spriteDrawCount = 0;
        var spriteHeight = testBit(me.PPUCTRL[0], 5) ? 16 : 8;

        for (var i = 0x100 - 0x04; i >= 0x0; i -= 4) {
            var spriteX = me.oamReadByte(i + 3);
            var spriteY = me.oamReadByte(i);
            var yInTile = me.scanline - spriteY;

            if (yInTile < 0 || yInTile >= spriteHeight) {
                continue;
            }

            spriteDrawCount++;

            if (spriteDrawCount > 8) {
                me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 5, true);
            }

            var hflip = testBit(me.oamReadByte(i + 2), 6);
            var vflip = testBit(me.oamReadByte(i + 2), 7);

            var tileAddress = 0;
            var tile = me.oamReadByte(i + 1);
            if (vflip) {
                yInTile = spriteHeight - 1 - yInTile;
            }

            if (spriteHeight == 8) {
                var table = testBit(me.PPUCTRL[0], 3) ? 1 : 0;
                tileAddress = 0x1000 * table + 16 * tile + yInTile;
            }
            else {
                var table = tile & 0x01;
                tile &= 0xFE;
                if (yInTile > 7) {
                    yInTile -= 8;
                    tile += 1;
                }
                tileAddress = 0x1000 * table + 16 * tile + yInTile;
            }
            var l = me.readByte(tileAddress);
            var h = me.readByte(tileAddress + 8);

            var paletteAttribute = me.oamReadByte(i + 2) & 0x03;
            var paletteAddress = 0x3F10 + (paletteAttribute << 2);

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
                screenSetPixel(spriteX + x, me.scanline, idx);

                if (testBit(me.PPUMASK[0], 3) && !me.spriteHitOccured && i == 0 && me.screenBackground[spriteX + x][me.scanline] == color) {
                    me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 6, true);
                    me.spriteHitOccured = true;
                }
            }
        }
    };

    this.run = function() {
        if (me.scanline == -1) {
            me.v = me.t;
        }
        else if (me.scanline < 240) {
            if (testBit(me.PPUMASK[0], 3)) {
                me.drawBackgroundScanline(); 
            }

            if (testBit(me.PPUMASK[0], 4)) {
                me.drawSpriteScanline();
            }

            if (memoryMapper.handleScanline) {
                memoryMapper.handleScanline()
            }
        }
        else if (me.scanline == 240) {
            me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 6, false);
            me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 7, true);
            if (testBit(me.PPUCTRL[0], 7)) {
                cpu.interrupt();
            }
        }
        else if (me.scanline == 261) {
            me.scanline = -2;
            me.spriteHitOccured = false;
            me.PPUSTATUS[0] = setBit(me.PPUSTATUS[0], 7, false);
            updateScreen();
        }

        me.scanline++;
    };

    this.setChrData = function(chrData) {
        me.chrData = chrData;
        me.memory.set(chrData, 0x0000);
    };

    this.oamWriteByte = function(value) {
        me.oamMemory[me.OAMADDR[0]++] = value;
    };

    this.oamReadByte = function(address) {
        return me.oamMemory[address];
    };

    this.mirrorAddress = function(address) {
        if (memoryMapper.mirror == 0) {
            if (address < 0x2400) {
            }
            else if (address < 0x2800) {
            }
            else if (address < 0x2C00) {
                address -= 0x0800;
            }
            else {
                address -= 0x0800;
            }
        }
        else {
            if (address < 0x2400) {
            }
            else if (address < 0x2800) {
                address -= 0x0400; 
            }
            else if (address < 0x2C00) {
            }
            else {
                address -= 0x0400;
            }
        }
        return address;
    };

    this.writeByte = function(address, value) {
        if (address < 0x2000) {
            memoryMapper.writeByte(address, value);
        }
        else if (address < 0x3000) {
            me.memory[me.mirrorAddress(address)] = value;
        }
        else if (address < 0x3F00) {
            throw('Implement PPU Write');
        }
        else if (address < 0x4000) {
            address = 0x3F00 | (address & 0x1F);
            if (address == 0x3F10 || address == 0x3F14 || address == 0x3F18 || address == 0x3F1C) {
                me.memory[address - 0x10] = value;
            }
            else {
                me.memory[address] = value;
            }
        }
        else {
            throw('Invalid PPU memory access');
        }
    };

    this.readByte = function(address) {
        if (address < 0x2000) {
            return memoryMapper.readByte(address);
        }
        else if (address < 0x3000) {
            return me.memory[me.mirrorAddress(address)];
        }
        else if (address < 0x3F00) {
            throw('Implement PPU Write');
        }
        else if (address < 0x4000) {
            address = 0x3F00 | (address & 0x1F);
            if (address == 0x3F10 || address == 0x3F14 || address == 0x3F18 || address == 0x3F1C) {
                return me.memory[address - 0x10];
            }
            else {
                return me.memory[address];
            }
        }
        else {
            throw('Invalid PPU memory access');
        }
    };
};
