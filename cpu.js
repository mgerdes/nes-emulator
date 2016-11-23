var NES = NES || { };

NES.CPU = function() {
    var me = this;

    var C_FLAG = 0;
    var Z_FLAG = 1;
    var I_FLAG = 2;
    var D_FLAG = 3;
    var B_FLAG = 4;
    var U_FLAG = 5;
    var V_FLAG = 6;
    var N_FLAG = 7;

    me.P = new Uint8Array(1);
    me.PC = new Uint16Array(1);
    me.SP = new Uint8Array(1);
    me.A = new Int8Array(1);
    me.X = new Int8Array(1);
    me.Y = new Int8Array(1);

    var ADDR = new Uint16Array(1);
    var TEMP = new Int8Array(1);
    var TEMP2 = new Int8Array(1);
    var UTEMP = new Uint8Array(1);
    var UTEMP2 = new Uint8Array(1);

    me.P[0] = 0x24;
    me.PC[0] = 0x0;
    me.SP[0] = 0x0;
    me.A[0] = 0x0;
    me.X[0] = 0x0;
    me.Y[0] = 0x0;

    me.memory = new Uint8Array(0x10000);
    var count = 0;

    var indirectX = function() {
        UTEMP[0] = me.X[0];
        UTEMP2[0] = me.readByte(me.PC[0] + 1);
        ADDR[0] = me.readByte((UTEMP2[0] + UTEMP[0] + 1) & 0xFF) << 8 + me.readByte((UTEMP2[0] + UTEMP[0]) & 0xFF);
    };

    this.getCount = function() {
        return count;
    };

    this.run = function(cycles) {
        //var count = 0;

        var prevOpCode = null;

        while (cycles > 0) {
            count++;
            var opCode = me.readByte(me.PC[0]);

            var debugCondition = false;

            if (debugCondition) {
                console.log('\ncount: ' + count);
                if (prevOpCode)
                    console.log('prev opcode: ' + prevOpCode.toString(16));
                console.log('opcode: ' + opCode.toString(16));
                console.log('cycles: ' + cycles);
                console.log('flags: ' + me.P[0].toString(16));
                console.log('pc: ' + me.PC[0].toString(16));
                console.log('sp: ' + me.SP[0].toString(16));
                UTEMP[0] = me.A[0];
                console.log('a: ' + UTEMP[0].toString(16));
                UTEMP[0] = me.X[0];
                console.log('x: ' + UTEMP[0].toString(16));
                UTEMP[0] = me.Y[0];
                console.log('y: ' + UTEMP[0].toString(16));
            }

            switch (opCode) {
                // JMP Absolute
                case 0x4C:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    me.PC[0] = ADDR[0];
                    cycles -= 3;
                    break;

                // JMP Indirect
                case 0x6C:
                    ADDR[0] = me.readWord(me.PC[0] + 1);

                    if ((ADDR[0] & 0xFF) == 0xFF) {
                        // Reading from 10FF and 1100 actually reads from 10FF and 1000 
                        me.PC[0] = (me.readByte(ADDR[0] & 0xFF00) << 8) + me.readByte(ADDR[0]);
                    }
                    else {
                        me.PC[0] = me.readWord(ADDR[0]);
                    }
                    cycles -= 5;
                    break;

                // SEI (Implied)
                case 0x78:
                    me.P[0] = setBit(me.P[0], I_FLAG, true);

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // SEC (Implied)
                case 0x38:
                    me.P[0] = setBit(me.P[0], C_FLAG, true);

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // SED (Implied)
                case 0xF8:
                    me.P[0] = setBit(me.P[0], D_FLAG, true);

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // CLD (Implied)
                case 0xD8:
                    me.P[0] = setBit(me.P[0], D_FLAG, false);

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // CBC (Implied)
                case 0x18:
                    me.P[0] = setBit(me.P[0], C_FLAG, false);
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // CLV (Implied)
                case 0xB8:
                    me.P[0] = setBit(me.P[0], V_FLAG, false);
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // LDA Immediate
                case 0xA9:
                    me.A[0] = me.readByte(me.PC[0] + 1);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // LDA Zero Page
                case 0xA5:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    me.A[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // LDA (Zero Page, X)
                case 0xB5:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    me.A[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // LDA Absolute
                case 0xAD:
                    me.A[0] = me.readByte(me.readWord(me.PC[0] + 1));
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // LDA (Absolute, X)
                case 0xBD:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    me.A[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    if (ADDR[0] >> 8 != me.PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // LDA (Absolute, Y)
                case 0xB9:
                    UTEMP[0] = me.Y[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    me.A[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    if (ADDR[0] >> 8 != me.PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // LDA (Indirect, X)
                case 0xA1:
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (me.readByte((UTEMP2[0] + me.X[0] + 1) & 0xFF) << 8) + me.readByte((UTEMP2[0] + me.X[0]) & 0xFF);
                    me.A[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // LDA (Indirect, Y)
                case 0xB1:
                    UTEMP[0] = me.Y[0];
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (((me.readByte((UTEMP2[0] + 1) & 0xFF) << 8) + me.readByte(UTEMP2[0])) + UTEMP[0]);
                    me.A[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // LDX Immediate
                case 0xA2:
                    me.X[0] = me.readByte(me.PC[0] + 1);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));

                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // LDX Zero Page
                case 0xA6:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    me.X[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // LDX (Zero Page, Y)
                case 0xB6:
                    UTEMP[0] = me.Y[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    me.X[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // LDX Absolute
                case 0xAE:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    me.X[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // LDX (Absolute, Y)
                case 0xBE:
                    UTEMP[0] = me.Y[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    me.X[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    if (ADDR[0] >> 8 != me.PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // LDY Immediate
                case 0xA0:
                    me.Y[0] = me.readByte(me.PC[0] + 1);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.Y[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.Y[0], 7));

                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // LDY (Zero Page)
                case 0xA4:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    me.Y[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.Y[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.Y[0], 7));

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // LDY (Zero Page, X)
                case 0xB4:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    me.Y[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.Y[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.Y[0], 7));

                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // LDY (Absolute)
                case 0xAC:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    me.Y[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.Y[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.Y[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // LDY (Absolute, X)
                case 0xBC:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    me.Y[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.Y[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.Y[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // BVS Relative
                case 0x70:
                    TEMP[0] = me.readByte(me.PC[0] + 1);
                    me.PC[0] += 2;
                    ADDR[0] = TEMP[0] + me.PC[0];

                    cycles -= 2;
                    if ((ADDR[0] >> 8) != (me.PC[0] >> 8)) {
                        cycles -= 1;
                    }

                    if (testBit(me.P[0], V_FLAG)) {
                        me.PC[0] = ADDR[0];
                    }
                    break;

                // BVC Relative
                case 0x50:
                    TEMP[0] = me.readByte(me.PC[0] + 1);
                    me.PC[0] += 2;
                    ADDR[0] = TEMP[0] + me.PC[0];

                    cycles -= 2;
                    if ((ADDR[0] >> 8) != (me.PC[0] >> 8)) {
                        cycles -= 1;
                    }

                    if (!testBit(me.P[0], V_FLAG)) {
                        me.PC[0] = ADDR[0];
                    }
                    break;

                // BEQ Relative
                case 0xF0:
                    TEMP[0] = me.readByte(me.PC[0] + 1);
                    me.PC[0] += 2;
                    ADDR[0] = TEMP[0] + me.PC[0];

                    cycles -= 2;
                    if ((ADDR[0] >> 8) != (me.PC[0] >> 8)) {
                        cycles -= 1;
                    }

                    if (testBit(me.P[0], Z_FLAG)) {
                        me.PC[0] = ADDR[0];
                    }
                    break;


                // BNE Relative
                case 0xD0:
                    TEMP[0] = me.readByte(me.PC[0] + 1);
                    me.PC[0] += 2;
                    ADDR[0] = TEMP[0] + me.PC[0];

                    cycles -= 2;
                    if ((ADDR[0] >> 8) != (me.PC[0] >> 8)) {
                        cycles -= 1;
                    }

                    if (!testBit(me.P[0], Z_FLAG)) {
                        me.PC[0] = ADDR[0];
                    }
                    break;
                
                // BCC Relative 
                case 0x90:
                    TEMP[0] = me.readByte(me.PC[0] + 1);
                    me.PC[0] += 2;
                    ADDR[0] = TEMP[0] + me.PC[0];

                    cycles -= 2;
                    if ((ADDR[0] >> 8) != (me.PC[0] >> 8)) {
                        cycles -= 1;
                    }

                    if (!testBit(me.P[0], C_FLAG)) {
                        me.PC[0] = ADDR[0];
                    }
                    break;
                
                // BCS Relative 
                case 0xB0:
                    TEMP[0] = me.readByte(me.PC[0] + 1);
                    me.PC[0] += 2;
                    ADDR[0] = TEMP[0] + me.PC[0];

                    cycles -= 2;
                    if ((ADDR[0] >> 8) != (me.PC[0] >> 8)) {
                        cycles -= 1;
                    }

                    if (testBit(me.P[0], C_FLAG)) {
                        me.PC[0] = ADDR[0];
                    }
                    break;

                // BPL Relative
                case 0x10:
                    TEMP[0] = me.readByte(me.PC[0] + 1);
                    me.PC[0] += 2;
                    ADDR[0] = TEMP[0] + me.PC[0];

                    cycles -= 2;
                    if ((ADDR[0] >> 8) != (me.PC[0] >> 8)) {
                        cycles -= 1;
                    }

                    if (!testBit(me.P[0], N_FLAG)) {
                        me.PC[0] = ADDR[0];
                    }
                    break;

                // BMI Relative 
                case 0x30:
                    TEMP[0] = me.readByte(me.PC[0] + 1);
                    me.PC[0] += 2;
                    ADDR[0] = TEMP[0] + me.PC[0];

                    cycles -= 2;
                    if ((ADDR[0] >> 8) != (me.PC[0] >> 8)) {
                        cycles -= 1;
                    }

                    if (testBit(me.P[0], N_FLAG)) {
                        me.PC[0] = ADDR[0];
                    }
                    break;

                // TXS Implied
                case 0x9A:
                    me.SP[0] = me.X[0];

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // TSX Implied
                case 0xBA:
                    me.X[0] = me.SP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // INX Implied
                case 0xE8:
                    me.X[0] += 1;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // INC (Zero Page)
                case 0xE6:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP[0] += 1;
                    me.writeByte(ADDR[0], TEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));
                    
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // INC (Zero Page, X)
                case 0xF6:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP[0] += 1;
                    me.writeByte(ADDR[0], TEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));
                    
                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // INC (Absolute)
                case 0xEE:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP[0] += 1;
                    me.writeByte(ADDR[0], TEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));
                    
                    me.PC[0] += 3;
                    cycles -= 6;
                    if (ADDR[0] >> 8 != me.PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // INC (Absolute, X)
                case 0xFE:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP[0] += 1;
                    me.writeByte(ADDR[0], TEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));
                    
                    me.PC[0] += 3;
                    cycles -= 7;
                    if (ADDR[0] >> 8 != me.PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // STA Zero Page
                case 0x85:
                    me.writeByte(me.readByte(me.PC[0] + 1), me.A[0]);

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // STA Zero Page, X
                case 0x95:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    me.writeByte(ADDR[0], me.A[0]);

                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // STA Absolute
                case 0x8D:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    me.writeByte(ADDR[0], me.A[0]);

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // STA (Absolute, X)
                case 0x9D:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    me.writeByte(ADDR[0], me.A[0]);

                    me.PC[0] += 3;
                    cycles -= 5;
                    if (ADDR[0] >> 8 != me.PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // STA (Absolute, Y)
                case 0x99:
                    UTEMP[0] = me.Y[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    me.writeByte(ADDR[0], me.A[0]);

                    me.PC[0] += 3;
                    cycles -= 5;
                    if (ADDR[0] >> 8 != me.PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // STA (Indirect, X)
                case 0x81:
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (me.readByte((UTEMP2[0] + me.X[0] + 1) & 0xFF) << 8) + me.readByte((UTEMP2[0] + me.X[0]) & 0xFF);
                    me.writeByte(ADDR[0], me.A[0]);

                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // STA (Indirect, Y)
                case 0x91:
                    UTEMP[0] = me.Y[0];
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (((me.readByte((UTEMP2[0] + 1) & 0xFF) << 8) + me.readByte(UTEMP2[0])) + UTEMP[0]);
                    me.writeByte(ADDR[0], me.A[0]);

                    me.PC[0] += 2;
                    cycles -= 6;
                    if (ADDR[0] >> 8 != me.PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // TXA Implied
                case 0x8A:
                    me.A[0] = me.X[0]; 
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));
                    
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // TAY Implied
                case 0xA8:
                    me.Y[0] = me.A[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.Y[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.Y[0], 7));

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // STX (Zero Page)
                case 0x86:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    me.writeByte(me.readByte(me.PC[0] + 1), me.X[0]);

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // STX (Zero Page, Y)
                case 0x96:
                    UTEMP[0] = me.Y[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    me.writeByte(ADDR[0], me.X[0]);

                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // STX Absolute
                case 0x8E:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    me.writeByte(ADDR[0], me.X[0]);

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // STY (Zero Page)
                case 0x84:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    me.writeByte(ADDR[0], me.Y[0]);

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // STY (Zero Page, X)
                case 0x94:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    me.writeByte(ADDR[0], me.Y[0]);

                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // STY Absolute
                case 0x8C:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    me.writeByte(ADDR[0], me.Y[0]);

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // INY Implied
                case 0xC8:
                    me.Y[0] += 1;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.Y[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.Y[0], 7));

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // DEC (Zero Page)
                case 0xC6:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP[0] -= 1;
                    me.writeByte(ADDR[0], TEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // DEC (Zero Page, X)
                case 0xD6:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP[0] -= 1;
                    me.writeByte(ADDR[0], TEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // DEC (Absolute)
                case 0xCE:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP[0] -= 1;
                    me.writeByte(ADDR[0], TEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));

                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // DEC (Absolute, X)
                case 0xDE:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP[0] -= 1;
                    me.writeByte(ADDR[0], TEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));

                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // DEX Implied
                case 0xCA:
                    me.X[0] -= 1;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // DEY Implied
                case 0x88:
                    me.Y[0] -= 1;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.Y[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.Y[0], 7));

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // TAX Implied
                case 0xAA:
                    me.X[0] = me.A[0]; 
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;
                
                // TYA Implied
                case 0x98:
                    me.A[0] = me.Y[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // CMP Immediate
                case 0xC9:
                    ADDR[0] = me.PC[0] + 1;
                    UTEMP[0] = me.A[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // CMP Zero Page
                case 0xC5:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    UTEMP[0] = me.A[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // CMP (Zero Page, X)
                case 0xD5:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    UTEMP[0] = me.A[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // CMP (Absolute)
                case 0xCD:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    UTEMP[0] = me.A[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // CMP (Absolute, X)
                case 0xDD:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    UTEMP[0] = me.A[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // CMP (Absolute, Y)
                case 0xD9:
                    UTEMP[0] = me.Y[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    UTEMP[0] = me.A[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // CMP (Indirect, X)
                case 0xC1:
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (me.readByte((UTEMP2[0] + me.X[0] + 1) & 0xFF) << 8) + me.readByte((UTEMP2[0] + me.X[0]) & 0xFF);
                    UTEMP[0] = me.A[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 2;
                    cycles -= 6;
                    break;
                    
                // CMP (Indirect, Y)
                case 0xD1:
                    UTEMP[0] = me.Y[0];
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (((me.readByte((UTEMP2[0] + 1) & 0xFF) << 8) + me.readByte(UTEMP2[0])) + UTEMP[0]);
                    UTEMP[0] = me.A[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // CPX Immediate
                case 0xE0:
                    ADDR[0] = me.PC[0] + 1;
                    UTEMP[0] = me.X[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // CPX (Zero Page)
                case 0xE4:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    UTEMP[0] = me.X[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // CPX (Absolute)
                case 0xEC:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    UTEMP[0] = me.X[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // CPY Immediate
                case 0xC0:
                    ADDR[0] = me.PC[0] + 1;
                    UTEMP[0] = me.Y[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // CPY (Zero Page)
                case 0xC4:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    UTEMP[0] = me.Y[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // CPY (Absolute)
                case 0xCC:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    UTEMP[0] = me.Y[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
                    me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // JSR Absolute
                case 0x20:
                    me.pushWord(me.PC[0] + 2);
                    me.PC[0] = me.readWord(me.PC[0] + 1);
                    cycles -= 6;
                    break;

                // RTR Implied
                case 0x60:
                    me.PC[0] = me.popWord() + 1;
                    cycles -= 6;
                    break;

                // RTI Implied
                case 0x40:
                    me.P[0] = me.popByte() | 0x20;

                    me.PC[0] = me.popWord();
                    cycles -= 6;
                    break;

                // PHA Implied
                case 0x48:
                    me.pushByte(me.A[0]);
                    me.PC[0] += 1;
                    cycles -= 3;
                    break;
                
                // PLA Implied
                case 0x68:
                    me.A[0] = me.popByte();
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 1;
                    cycles -= 4;
                    break;

                // PHP Implied
                case 0x08:
                    me.pushByte(me.P[0]);
                    me.PC[0] += 1;
                    cycles -= 3;
                    break;

                // PLP Implied
                case 0x28:
                    me.P[0] = me.popByte();

                    me.PC[0] += 1;
                    cycles -= 4;
                    break;
                
                // LSR (Accumulator)
                case 0x4A:
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(me.A[0], 0));
                    me.A[0] = me.A[0] >> 1;
                    me.A[0] = setBit(me.A[0], 7, false);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // LSR (Zero Page)
                case 0x46:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    UTEMP[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(UTEMP[0], 0));
                    UTEMP[0] = UTEMP[0] >> 1;
                    UTEMP[0] = setBit(UTEMP[0], 7, false);
                    me.writeByte(ADDR[0], UTEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, UTEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(UTEMP[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // LSR (Zero Page, X)
                case 0x56:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    UTEMP[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(UTEMP[0], 0));
                    UTEMP[0] = UTEMP[0] >> 1;
                    UTEMP[0] = setBit(UTEMP[0], 7, false);
                    me.writeByte(ADDR[0], UTEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, UTEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(UTEMP[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // LSR (Absolute)
                case 0x4E:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    UTEMP[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(UTEMP[0], 0));
                    UTEMP[0] = UTEMP[0] >> 1;
                    UTEMP[0] = setBit(UTEMP[0], 7, false);
                    me.writeByte(ADDR[0], UTEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, UTEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(UTEMP[0], 7));

                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // LSR (Absolute, X)
                case 0x5E:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    UTEMP[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(UTEMP[0], 0));
                    UTEMP[0] = UTEMP[0] >> 1;
                    UTEMP[0] = setBit(UTEMP[0], 7, false);
                    me.writeByte(ADDR[0], UTEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, UTEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(UTEMP[0], 7));

                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // ORA (Immediate)
                case 0x09:
                    ADDR[0] = me.PC[0] + 1;
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] | TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // ORA (Zero Page)
                case 0x05:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] | TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // ORA (Zero Page, X)
                case 0x15:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] | TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // ORA (Absolute)
                case 0x0D:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] | TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ORA (Absolute, X)
                case 0x1D:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] | TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ORA (Absolute, Y)
                case 0x19:
                    UTEMP[0] = me.Y[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] | TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ORA (Indirect, X)
                case 0x01:
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (me.readByte((UTEMP2[0] + me.X[0] + 1) & 0xFF) << 8) + me.readByte((UTEMP2[0] + me.X[0]) & 0xFF);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] | TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ORA (Indirect, Y)
                case 0x11:
                    UTEMP[0] = me.Y[0];
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (((me.readByte((UTEMP2[0] + 1) & 0xFF) << 8) + me.readByte(UTEMP2[0])) + UTEMP[0]);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] | TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // AND (Immediate)
                case 0x29:
                    TEMP[0] = me.readByte(me.PC[0] + 1);
                    me.A[0] = me.A[0] & TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 2;
                    break;
                    
                // AND (Zero Page)
                case 0x25:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] & TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;


                // AND (Zero Page, X)
                case 0x35:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] & TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 4;
                    break;
                    
                // AND (Absolute)
                case 0x2D:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] & TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // AND (Absolute, X)
                case 0x3D:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] & TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // AND (Absolute, Y)
                case 0x39:
                    UTEMP[0] = me.Y[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] & TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // AND (Indirect, X)
                case 0x21:
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (me.readByte((UTEMP2[0] + me.X[0] + 1) & 0xFF) << 8) + me.readByte((UTEMP2[0] + me.X[0]) & 0xFF);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] & TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // AND (Indirect, Y)
                case 0x31:
                    UTEMP[0] = me.Y[0];
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (((me.readByte((UTEMP2[0] + 1) & 0xFF) << 8) + me.readByte(UTEMP2[0])) + UTEMP[0]);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] & TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // EOR Immediate
                case 0x49:
                    me.A[0] = me.A[0] ^ me.readByte(me.PC[0] + 1);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // EOR (Zero Page);
                case 0x45:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] ^ TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // EOR (Zero Page, X);
                case 0x55:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] ^ TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // EOR (Absolute);
                case 0x4D:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] ^ TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // EOR (Absolute, X);
                case 0x5D:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] ^ TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // EOR (Absolute, Y);
                case 0x59:
                    UTEMP[0] = me.Y[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] ^ TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // EOR (Indirect, X);
                case 0x41:
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (me.readByte((UTEMP2[0] + me.X[0] + 1) & 0xFF) << 8) + me.readByte((UTEMP2[0] + me.X[0]) & 0xFF);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] ^ TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // EOR (Indirect, Y);
                case 0x51:
                    UTEMP[0] = me.Y[0];
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (((me.readByte((UTEMP2[0] + 1) & 0xFF) << 8) + me.readByte(UTEMP2[0])) + UTEMP[0]);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.A[0] = me.A[0] ^ TEMP[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // ROR (Accumulator)
                case 0x6A:
                    TEMP[0] = me.A[0] >> 1;
                    TEMP[0] = setBit(TEMP[0], 7, testBit(me.P[0], C_FLAG));
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(me.A[0], 0));
                    me.A[0] = TEMP[0];
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // ROR (Zero Page)
                case 0x66:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);

                    TEMP2[0] = TEMP[0] >> 1;
                    TEMP2[0] = setBit(TEMP2[0], 7, testBit(me.P[0], C_FLAG));
                    me.writeByte(ADDR[0], TEMP2[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 0));
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP2[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ROR (Zero Page, X)
                case 0x76:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    TEMP[0] = me.readByte(ADDR[0]);

                    TEMP2[0] = TEMP[0] >> 1;
                    TEMP2[0] = setBit(TEMP2[0], 7, testBit(me.P[0], C_FLAG));
                    me.writeByte(ADDR[0], TEMP2[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 0));
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP2[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ROR (Absolute)
                case 0x6E:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);

                    TEMP2[0] = TEMP[0] >> 1;
                    TEMP2[0] = setBit(TEMP2[0], 7, testBit(me.P[0], C_FLAG));
                    me.writeByte(ADDR[0], TEMP2[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 0));
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP2[0], 7));

                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // ROR (Absolute, X)
                case 0x7E:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);

                    TEMP2[0] = TEMP[0] >> 1;
                    TEMP2[0] = setBit(TEMP2[0], 7, testBit(me.P[0], C_FLAG));
                    me.writeByte(ADDR[0], TEMP2[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 0));
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP2[0], 7));

                    me.PC[0] += 3;
                    cycles -= 7;
                    break;

                // ROL (Accumulator)
                case 0x2A:
                    TEMP[0] = me.A[0] << 1;
                    TEMP[0] = setBit(TEMP[0], 0, testBit(me.P[0], C_FLAG));
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(me.A[0], 7));
                    me.A[0] = TEMP[0];
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // ROL (Zero Page)
                case 0x26:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);

                    TEMP2[0] = TEMP[0] << 1;
                    TEMP2[0] = setBit(TEMP2[0], 0, testBit(me.P[0], C_FLAG));
                    me.writeByte(ADDR[0], TEMP2[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 7));
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP2[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ROL (Zero Page, X)
                case 0x36:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    TEMP[0] = me.readByte(ADDR[0]);

                    TEMP2[0] = TEMP[0] << 1;
                    TEMP2[0] = setBit(TEMP2[0], 0, testBit(me.P[0], C_FLAG));
                    me.writeByte(ADDR[0], TEMP2[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 7));
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP2[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ROL (Absolute)
                case 0x2E:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);

                    TEMP2[0] = TEMP[0] << 1;
                    TEMP2[0] = setBit(TEMP2[0], 0, testBit(me.P[0], C_FLAG));
                    me.writeByte(ADDR[0], TEMP2[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 7));
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP2[0], 7));

                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // ROL (Absolute, X)
                case 0x3E:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);

                    TEMP2[0] = TEMP[0] << 1;
                    TEMP2[0] = setBit(TEMP2[0], 0, testBit(me.P[0], C_FLAG));
                    me.writeByte(ADDR[0], TEMP2[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 7));
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP2[0], 7));

                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // ASL (Accumulator)
                case 0x0A:
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(me.A[0], 7));
                    me.A[0] = me.A[0] << 1;
                    me.A[0] = setBit(me.A[0], 0, false);
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // ASL (Zero Page)
                case 0x06:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 7));
                    TEMP[0] = TEMP[0] << 1;
                    TEMP[0] = setBit(TEMP[0], 0, false);
                    me.writeByte(ADDR[0], TEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ASL (Zero Page, X)
                case 0x16:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 7));
                    TEMP[0] = TEMP[0] << 1;
                    TEMP[0] = setBit(TEMP[0], 0, false);
                    me.writeByte(ADDR[0], TEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ASL (Absolute)
                case 0x0E:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 7));
                    TEMP[0] = TEMP[0] << 1;
                    TEMP[0] = setBit(TEMP[0], 0, false);
                    me.writeByte(ADDR[0], TEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));

                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // ASL (Absolute, X)
                case 0x1E:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);
                    me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 7));
                    TEMP[0] = TEMP[0] << 1;
                    TEMP[0] = setBit(TEMP[0], 0, false);
                    me.writeByte(ADDR[0], TEMP[0]);
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));

                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // BIT (Zero Page)
                case 0x24:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP2[0] = TEMP[0] & me.A[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP2[0] == 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, testBit(TEMP[0], 6));
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // BIT (Absolute)
                case 0x2C:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP2[0] = TEMP[0] & me.A[0];
                    me.P[0] = setBit(me.P[0], Z_FLAG, TEMP2[0] == 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, testBit(TEMP[0], 6));
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ADC (Immediate)
                case 0x69:
                    UTEMP[0] = me.readByte(me.PC[0] + 1);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP[0] + UTEMP2[0] + (testBit(me.P[0], C_FLAG) ? 1 : 0);
                    me.P[0] = setBit(me.P[0], C_FLAG, result >= 0x100);
                    me.P[0] = setBit(me.P[0], V_FLAG, (~(me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // ADC (Zero Page)
                case 0x65:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP[0] + UTEMP2[0] + (testBit(me.P[0], C_FLAG) ? 1 : 0);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result &  0x100) != 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, (~(me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // ADC (Zero Page, X)
                case 0x75:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP[0] + UTEMP2[0] + (testBit(me.P[0], C_FLAG) ? 1 : 0);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result &  0x100) != 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, (~(me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // ADC (Absolute)
                case 0x6D:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP[0] + UTEMP2[0] + (testBit(me.P[0], C_FLAG) ? 1 : 0);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result &  0x100) != 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, (~(me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ADC (Absolute, X)
                case 0x7D:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP[0] + UTEMP2[0] + (testBit(me.P[0], C_FLAG) ? 1 : 0);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result &  0x100) != 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, (~(me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ADC (Absolute, Y)
                case 0x79:
                    UTEMP[0] = me.Y[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP[0] + UTEMP2[0] + (testBit(me.P[0], C_FLAG) ? 1 : 0);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result &  0x100) != 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, (~(me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ADC (Indirect, X)
                case 0x61:
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (me.readByte((UTEMP2[0] + me.X[0] + 1) & 0xFF) << 8) + me.readByte((UTEMP2[0] + me.X[0]) & 0xFF);
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP[0] + UTEMP2[0] + (testBit(me.P[0], C_FLAG) ? 1 : 0);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result &  0x100) != 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, (~(me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // ADC (Indirect, Y)
                case 0x71:
                    UTEMP[0] = me.Y[0];
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (((me.readByte((UTEMP2[0] + 1) & 0xFF) << 8) + me.readByte(UTEMP2[0])) + UTEMP[0]);
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP[0] + UTEMP2[0] + (testBit(me.P[0], C_FLAG) ? 1 : 0);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result &  0x100) != 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, (~(me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // SBC (Immediate)
                case 0xE9:
                    UTEMP[0] = me.readByte(me.PC[0] + 1);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP2[0] - UTEMP[0] - (testBit(me.P[0], C_FLAG) ? 0 : 1);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result & 0x100) == 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, ((me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // SBC (Zero Page)
                case 0xE5:
                    ADDR[0] = me.readByte(me.PC[0] + 1);
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP2[0] - UTEMP[0] - (testBit(me.P[0], C_FLAG) ? 0 : 1);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result & 0x100) == 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, ((me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // SBC (Zero Page, X)
                case 0xF5:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = (me.readByte(me.PC[0] + 1) + UTEMP[0]) & 0xFF;
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP2[0] - UTEMP[0] - (testBit(me.P[0], C_FLAG) ? 0 : 1);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result & 0x100) == 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, ((me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // SBC (Absolute)
                case 0xED:
                    ADDR[0] = me.readWord(me.PC[0] + 1);
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP2[0] - UTEMP[0] - (testBit(me.P[0], C_FLAG) ? 0 : 1);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result & 0x100) == 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, ((me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // SBC (Absolute, X)
                case 0xFD:
                    UTEMP[0] = me.X[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP2[0] - UTEMP[0] - (testBit(me.P[0], C_FLAG) ? 0 : 1);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result & 0x100) == 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, ((me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // SBC (Absolute, Y)
                case 0xF9:
                    UTEMP[0] = me.Y[0];
                    ADDR[0] = me.readWord(me.PC[0] + 1) + UTEMP[0];
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP2[0] - UTEMP[0] - (testBit(me.P[0], C_FLAG) ? 0 : 1);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result & 0x100) == 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, ((me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // SBC (Indirect, X)
                case 0xE1:
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (me.readByte((UTEMP2[0] + me.X[0] + 1) & 0xFF) << 8) + me.readByte((UTEMP2[0] + me.X[0]) & 0xFF);
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP2[0] - UTEMP[0] - (testBit(me.P[0], C_FLAG) ? 0 : 1);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result & 0x100) == 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, ((me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // SBC (Indirect, Y)
                case 0xF1:
                    UTEMP[0] = me.Y[0];
                    UTEMP2[0] = me.readByte(me.PC[0] + 1);
                    ADDR[0] = (((me.readByte((UTEMP2[0] + 1) & 0xFF) << 8) + me.readByte(UTEMP2[0])) + UTEMP[0]);
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = me.A[0];
                    var result = UTEMP2[0] - UTEMP[0] - (testBit(me.P[0], C_FLAG) ? 0 : 1);
                    me.P[0] = setBit(me.P[0], C_FLAG, (result & 0x100) == 0);
                    me.P[0] = setBit(me.P[0], V_FLAG, ((me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
                    me.A[0] = result;
                    me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                    me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // NOP
                case 0xEA:
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                default:
                    throw('Invalid opcode: ' + opCode.toString(16));
                    return;
            };

            if (debugCondition) {
                console.log('addr: ' + ADDR[0].toString(16));
                console.log('after:');
                console.log('flags: ' + me.P[0].toString(16));
                console.log('pc: ' + me.PC[0].toString(16));
                console.log('sp: ' + me.SP[0].toString(16));
                UTEMP[0] = me.A[0];
                console.log('me.a: ' + UTEMP[0].toString(16));
                UTEMP[0] = me.X[0];
                console.log('x: ' + UTEMP[0].toString(16));
                UTEMP[0] = me.Y[0];
                console.log('y: ' + UTEMP[0].toString(16));
            }

            prevOpCode = opCode;
        }
    };

    this.interrupt = function() {
        me.P[0] = setBit(me.P[0], I_FLAG, true);
        me.P[0] = setBit(me.P[0], U_FLAG, false);
        me.pushWord(me.PC[0]);
        me.pushByte(me.P[0]);
        me.PC[0] = me.readWord(0xFFFA);
        //console.log('pc - ' + me.PC[0].toString(16));
    };

    this.pushByte = function(value) {
        me.writeByte(0x100 + me.SP[0], value);
        me.SP[0] -= 1;
    };

    this.pushWord = function(value) {
        me.writeWord(0xFF + me.SP[0], value);
        me.SP[0] -= 2;
    };

    this.popByte = function() {
        me.SP[0] += 1;
        return me.readByte(0x100 + me.SP[0]);
    };

    this.popWord = function() {
        me.SP[0] += 2;
        return me.readWord(0xFF + me.SP[0]);
    };

    this.writeByte = function(address, value) {
        if (address == 0x4014) {
            for (var i = 0; i < 256; i++) {
                ppu.oamWriteByte(me.readByte(0x100 * value + i));
            }
            return;
        }

        switch (address >> 13) {
            case 1:
                ppu.writeIO(address, value);
                break;

            case 2:
                controller.writeIO(address, value);
                break;

            case 3:
                throw('Implement CPU RAM');
                break;

            default:
                if (address >= 0x0800 && address < 0x1600) {
                    throw('Map the memory');
                }
                me.memory[address] = value;
        }
    };

    this.readByte = function(address) {
        switch (address >> 13) {
            case 1:
                return ppu.readIO(address);

            case 2:
                return controller.readIO(address);

            case 3: 
                throw('Implement CPU RAM');
                break;

            default:
                return me.memory[address];
        }
    };

    this.writeWord = function(address, value) {
        me.writeByte(address, value & 0xFF);
        me.writeByte(address + 1, value >> 8);
    };

    this.readWord = function(address) {
        return me.readByte(address) + (me.readByte(address + 1) << 8);
    };

    this.setMemory = function(address, data) {
        me.memory.set(data, address);
    };

    this.loadPrgData = function(prgData) {
        me.memory.set(prgData, 0x8000);
    };

    this.init = function() {

    };

    this.reset = function() {
        me.PC[0] = me.readWord(0xFFFC);
        me.SP[0] -= 3;
    };
};
