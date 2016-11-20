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

    var P = new Uint8Array(1);
    var PC = new Uint16Array(1);
    var SP = new Uint8Array(1);
    var A = new Int8Array(1);
    var X = new Int8Array(1);
    var Y = new Int8Array(1);

    var ADDR = new Uint16Array(1);
    var TEMP = new Int8Array(1);
    var TEMP2 = new Int8Array(1);
    var UTEMP = new Uint8Array(1);
    var UTEMP2 = new Uint8Array(1);

    P[0] = 0x24;
    PC[0] = 0x0;
    SP[0] = 0x0;
    A[0] = 0x0;
    X[0] = 0x0;
    Y[0] = 0x0;

    var memory = new Uint8Array(0x10000);

    var count = 0;

    this.getCount = function() {
        return count;
    };

    this.run = function(cycles) {
        //var count = 0;

        while (cycles > 0) {
            count++;
            var opCode = me.readByte(PC[0]);

            if (count < 0) {
                console.log('\ncount: ' + count);
                console.log('opcode: ' + opCode.toString(16));
                console.log('flags: ' + P[0].toString(16));
                console.log('pc: ' + PC[0].toString(16));
                console.log('sp: ' + SP[0].toString(16));
                console.log('cycles: ' + cycles);
                UTEMP[0] = A[0];
                console.log('a: ' + UTEMP[0].toString(16));
                UTEMP[0] = X[0];
                console.log('x: ' + UTEMP[0].toString(16));
                UTEMP[0] = Y[0];
                console.log('y: ' + UTEMP[0].toString(16));
            }

            switch (opCode) {
                // JMP Absolute
                case 0x4C:
                    PC[0] = me.readWord(PC[0] + 1);
                    cycles -= 3;
                    break;

                // JMP Indirect
                case 0x6C:
                    ADDR[0] = me.readWord(PC[0] + 1);
                    PC[0] = me.readWord(ADDR[0]);
                    cycles -= 5;
                    break;

                // SEI Disable
                case 0x78:
                    P[0] = setBit(P[0], I_FLAG, true);

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // CLD Mode
                case 0xD8:
                    P[0] = setBit(P[0], D_FLAG, false);

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // LDA Immediate
                case 0xA9:
                    A[0] = me.readByte(PC[0] + 1);
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 2;
                    cycles -= 2;
                    break;

                // LDA Zero Page
                case 0xA5:
                    ADDR[0] = me.readByte(PC[0] + 1);
                    A[0] = me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 2;
                    cycles -= 3;
                    break;

                // LDA (Zero Page, X)
                case 0xB5:
                    UTEMP[0] = X[0];
                    ADDR[0] = me.readByte(PC[0] + 1) + UTEMP[0];
                    A[0] = me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 2;
                    cycles -= 4;
                    break;

                // LDA Absolute
                case 0xAD:
                    A[0] = me.readByte(me.readWord(PC[0] + 1));
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 3;
                    cycles -= 4;
                    break;

                // LDA (Absolute, X)
                case 0xBD:
                    UTEMP[0] = X[0];
                    ADDR[0] = me.readWord(PC[0] + 1) + UTEMP[0];
                    A[0] = me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 3;
                    cycles -= 4;
                    if (ADDR[0] >> 8 != PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // LDA (Absolute, Y)
                case 0xB9:
                    UTEMP[0] = Y[0];
                    ADDR[0] = me.readWord(PC[0] + 1) + UTEMP[0];
                    A[0] = me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 3;
                    cycles -= 4;
                    if (ADDR[0] >> 8 != PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // LDA (Indirect, Y)
                case 0xB1:
                    UTEMP[0] = Y[0];
                    ADDR[0] = me.readWord(me.readByte(PC[0] + 1)) + UTEMP[0];
                    A[0] = me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 2;
                    cycles -= 5;
                    if (ADDR[0] >> 8 != PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // STA Absolute
                case 0x8D:
                    ADDR[0] = me.readWord(PC[0] + 1);
                    me.writeByte(ADDR[0], A[0]);

                    PC[0] += 3;
                    cycles -= 4;
                    break;

                // STA (Absolute, Y)
                case 0x99:
                    UTEMP[0] = Y[0];
                    ADDR[0] = me.readWord(PC[0] + 1) + UTEMP[0];
                    me.writeByte(ADDR[0], A[0]);

                    PC[0] += 3;
                    cycles -= 5;
                    if (ADDR[0] >> 8 != PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // LDX Immediate
                case 0xA2:
                    X[0] = me.readByte(PC[0] + 1);
                    P[0] = setBit(P[0], Z_FLAG, X[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(X[0], 7));

                    PC[0] += 2;
                    cycles -= 2;
                    break;

                // LDX Zero Page
                case 0xA6:
                    ADDR[0] = me.readByte(PC[0] + 1);
                    X[0] = me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], Z_FLAG, X[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(X[0], 7));

                    PC[0] += 2;
                    cycles -= 3;
                    break;

                // LDX Absolute
                case 0xAE:
                    ADDR[0] = me.readWord(PC[0] + 1);
                    X[0] = me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], Z_FLAG, X[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(X[0], 7));

                    PC[0] += 3;
                    cycles -= 4;
                    break;

                // LDX (Absolute, Y)
                case 0xBE:
                    UTEMP[0] = Y[0];
                    ADDR[0] = me.readWord(PC[0] + 1) + UTEMP[0];
                    X[0] = me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], Z_FLAG, X[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(X[0], 7));

                    PC[0] += 3;
                    cycles -= 4;
                    if (ADDR[0] >> 8 != PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // LDY Immediate
                case 0xA0:
                    Y[0] = me.readByte(PC[0] + 1);
                    P[0] = setBit(P[0], Z_FLAG, Y[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(Y[0], 7));

                    PC[0] += 2;
                    cycles -= 2;
                    break;

                // LDY (Zero Page)
                case 0xA4:
                    ADDR[0] = me.readByte(PC[0] + 1);
                    Y[0] = me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], Z_FLAG, Y[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(Y[0], 7));

                    PC[0] += 2;
                    cycles -= 3;
                    break;

                // BPL Relative
                case 0x10:
                    ADDR[0] = PC[0] + 1;

                    if (testBit(P[0], N_FLAG)) {
                        PC[0] += 2;
                        cycles -= 2;
                    }
                    else {
                        TEMP[0] = me.readByte(ADDR[0]);
                        PC[0] += (TEMP[0] + 2);
                        cycles -= 2;
                    }

                    if ((ADDR[0] >> 8) != (PC[0] >> 8)) {
                        cycles -= 1;
                    }
                    break;

                // BVS Relative
                case 0x70:
                    ADDR[0] = PC[0] + 1;

                    if (testBit(P[0], V_FLAG)) {
                        TEMP[0] = me.readByte(ADDR[0]);
                        PC[0] += (TEMP[0] + 2);
                        cycles -= 2;
                    }
                    else {
                        PC[0] += 2;
                        cycles -= 2;
                    }

                    if ((ADDR[0] >> 8) != (PC[0] >> 8)) {
                        cycles -= 1;
                    }
                    break;

                // BVC Relative
                case 0x50:
                    ADDR[0] = PC[0] + 1;

                    if (testBit(P[0], V_FLAG)) {
                        PC[0] += 2;
                        cycles -= 2;
                    }
                    else {
                        TEMP[0] = me.readByte(ADDR[0]);
                        PC[0] += (TEMP[0] + 2);
                        cycles -= 2;
                    }

                    if ((ADDR[0] >> 8) != (PC[0] >> 8)) {
                        cycles -= 1;
                    }
                    break;

                // BEQ Relative
                case 0xF0:
                    ADDR[0] = PC[0] + 1;
                    
                    if (testBit(P[0], Z_FLAG)) {
                        TEMP[0] = me.readByte(ADDR[0]);
                        PC[0] += (TEMP[0] + 2);
                        cycles -= 2;
                    }
                    else {
                        PC[0] += 2;
                        cycles -= 2;
                    }

                    if ((ADDR[0] >> 8) != (PC[0] >> 8)) {
                        cycles -= 1;
                    }
                    break;


                // BNE Relative
                case 0xD0:
                    ADDR[0] = PC[0] + 1;

                    if (testBit(P[0], Z_FLAG)) {
                        PC[0] += 2;
                        cycles -= 2;
                    }
                    else {
                        TEMP[0] = me.readByte(ADDR[0]);
                        PC[0] += (TEMP[0] + 2);
                        cycles -= 2;
                    }

                    if ((ADDR[0] >> 8) != (PC[0] >> 8)) {
                        cycles -= 1;
                    }
                    break;
                
                // BCC Relative 
                case 0x90:
                    ADDR[0] = PC[0] + 1;

                    if (testBit(P[0], C_FLAG)) {
                        PC[0] += 2;
                        cycles -= 2;
                    }
                    else {
                        TEMP[0] = me.readByte(ADDR[0]);
                        PC[0] += (TEMP[0] + 2);
                        cycles -= 2;
                    }

                    if ((ADDR[0] >> 8) != (PC[0] >> 8)) {
                        cycles -= 1;
                    }
                    break;
                
                // BCS Relative 
                case 0xB0:
                    ADDR[0] = PC[0] + 1;

                    if (testBit(P[0], C_FLAG)) {
                        TEMP[0] = me.readByte(ADDR[0]);
                        PC[0] += (TEMP[0] + 2);
                        cycles -= 2;
                    }
                    else {
                        PC[0] += 2;
                        cycles -= 2;
                    }

                    if ((ADDR[0] >> 8) != (PC[0] >> 8)) {
                        cycles -= 1;
                    }
                    break;

                // BMI Relative 
                case 0x30:
                    ADDR[0] = PC[0] + 1;

                    if (testBit(P[0], N_FLAG)) {
                        TEMP[0] = me.readByte(ADDR[0]);
                        PC[0] += (TEMP[0] + 2);
                        cycles -= 2;
                    }
                    else {
                        PC[0] += 2;
                        cycles -= 2;
                    }

                    if ((ADDR[0] >> 8) != (PC[0] >> 8)) {
                        cycles -= 1;
                    }
                    break;

                // TXS Implied
                case 0x9A:
                    SP[0] = X[0];

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // INX Implied
                case 0xE8:
                    X[0] += 1;
                    P[0] = setBit(P[0], Z_FLAG, X[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(X[0], 7));

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // INC Memory (Zero Page)
                case 0xE6:
                    ADDR[0] = me.readByte(PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP[0] += 1;
                    me.writeByte(ADDR[0], TEMP[0]);
                    P[0] = setBit(P[0], Z_FLAG, TEMP[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(TEMP[0], 7));
                    
                    PC[0] += 2;
                    cycles -= 5;
                    break;

                // INC Memory (Absolute, X)
                case 0xFE:
                    UTEMP[0] = X[0];
                    ADDR[0] = me.readWord(PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP[0] += 1;
                    me.writeByte(ADDR[0], TEMP[0]);
                    P[0] = setBit(P[0], Z_FLAG, TEMP[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(TEMP[0], 7));
                    
                    PC[0] += 3;
                    cycles -= 7;
                    if (ADDR[0] >> 8 != PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // STA Zero Page
                case 0x85:
                    me.writeByte(me.readByte(PC[0] + 1), A[0]);

                    PC[0] += 2;
                    cycles -= 3;
                    break;

                // STA (Indirect, Y)
                case 0x91:
                    UTEMP[0] = Y[0];
                    ADDR[0] = me.readWord(me.readByte(PC[0] + 1)) + UTEMP[0];
                    me.writeByte(ADDR[0], A[0]);

                    PC[0] += 2;
                    cycles -= 6;
                    if (ADDR[0] >> 8 != PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // STA (Absolute, X)
                case 0x9D:
                    UTEMP[0] = X[0];
                    ADDR[0] = me.readWord(PC[0] + 1) + UTEMP[0];
                    me.writeByte(ADDR[0], A[0]);

                    PC[0] += 3;
                    cycles -= 5;
                    if (ADDR[0] >> 8 != PC[0] >> 8) {
                        cycles -= 1;
                    }
                    break;

                // STA Zero Page, X
                case 0x95:
                    UTEMP[0] = X[0];
                    ADDR[0] = me.readByte(PC[0] + 1) + UTEMP[0];
                    me.writeByte(ADDR[0], A[0]);

                    PC[0] += 2;
                    cycles -= 4;
                    break;

                // TXA Implied
                case 0x8A:
                    A[0] = X[0]; 
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));
                    
                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // TAY Implied
                case 0xA8:
                    Y[0] = A[0];
                    P[0] = setBit(P[0], Z_FLAG, Y[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(Y[0], 7));

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // STX Zero Page
                case 0x86:
                    me.writeByte(me.readByte(PC[0] + 1), X[0]);

                    PC[0] += 2;
                    cycles -= 3;
                    break;

                // STX Absolute
                case 0x8E:
                    ADDR[0] = me.readWord(PC[0] + 1);
                    me.writeByte(ADDR[0], X[0]);

                    PC[0] += 3;
                    cycles -= 4;
                    break;

                // STY (Zero Page)
                case 0x84:
                    ADDR[0] = me.readByte(PC[0] + 1);
                    me.writeByte(ADDR[0], Y[0]);

                    PC[0] += 2;
                    cycles -= 3;
                    break;

                // STY (Zero Page, X)
                case 0x94:
                    UTEMP[0] = X[0];
                    ADDR[0] = me.readByte(PC[0] + 1) + UTEMP[0];
                    me.writeByte(ADDR[0], Y[0]);

                    PC[0] += 2;
                    cycles -= 4;
                    break;

                // STY Absolute
                case 0x8C:
                    ADDR[0] = me.readWord(PC[0] + 1);
                    me.writeByte(ADDR[0], Y[0]);

                    PC[0] += 3;
                    cycles -= 4;
                    break;

                // INY Implied
                case 0xC8:
                    Y[0] += 1;
                    P[0] = setBit(P[0], Z_FLAG, Y[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(Y[0], 7));

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // DEC Zero Page
                case 0xC6:
                    ADDR[0] = me.readByte(PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP[0] -= 1;
                    me.writeByte(ADDR[0], TEMP[0]);
                    P[0] = setBit(P[0], Z_FLAG, TEMP[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(TEMP[0], 7));

                    PC[0] += 2;
                    cycles -= 5;
                    break;

                // DEX Implied
                case 0xCA:
                    X[0] -= 1;
                    P[0] = setBit(P[0], Z_FLAG, X[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(X[0], 7));

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // DEY Implied
                case 0x88:
                    Y[0] -= 1;
                    P[0] = setBit(P[0], Z_FLAG, Y[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(Y[0], 7));

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // TAX Implied
                case 0xAA:
                    X[0] = A[0]; 
                    P[0] = setBit(P[0], Z_FLAG, X[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(X[0], 7));

                    PC[0] += 1;
                    cycles -= 2;
                    break;
                
                // TYA Implied
                case 0x98:
                    A[0] = Y[0];
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // CMP Immediate
                case 0xC9:
                    ADDR[0] = PC[0] + 1;
                    UTEMP[0] = A[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], C_FLAG, result >= 0);
                    P[0] = setBit(P[0], Z_FLAG, result == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(result, 7));

                    PC[0] += 2;
                    cycles -= 2;
                    break;

                // CMP Zero Page
                case 0xC5:
                    ADDR[0] = me.readByte(PC[0] + 1);
                    UTEMP[0] = A[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], C_FLAG, result >= 0);
                    P[0] = setBit(P[0], Z_FLAG, result == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(result, 7));

                    PC[0] += 2;
                    cycles -= 3;
                    break;

                // CPX Immediate
                case 0xE0:
                    ADDR[0] = PC[0] + 1;
                    UTEMP[0] = X[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], C_FLAG, result >= 0);
                    P[0] = setBit(P[0], Z_FLAG, result == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(result, 7));

                    PC[0] += 2;
                    cycles -= 2;
                    break;

                // CPX (Zero Page)
                case 0xE4:
                    ADDR[0] = me.readByte(PC[0] + 1);
                    UTEMP[0] = X[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], C_FLAG, result >= 0);
                    P[0] = setBit(P[0], Z_FLAG, result == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(result, 7));

                    PC[0] += 2;
                    cycles -= 3;
                    break;

                // CPY Immediate
                case 0xC0:
                    ADDR[0] = PC[0] + 1;
                    UTEMP[0] = Y[0];
                    var result = UTEMP[0] - me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], C_FLAG, result >= 0);
                    P[0] = setBit(P[0], Z_FLAG, result == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(result, 7));

                    PC[0] += 2;
                    cycles -= 2;
                    break;


                // JSR Absolute
                case 0x20:
                    me.pushWord(PC[0] + 2);
                    PC[0] = me.readWord(PC[0] + 1);
                    cycles -= 6;
                    break;

                // RTR Implied
                case 0x60:
                    PC[0] = me.popWord() + 1;
                    cycles -= 6;
                    break;

                // RTI Implied
                case 0x40:
                    P[0] = me.popByte() | 0x20;

                    PC[0] = me.popWord();
                    cycles -= 6;
                    break;

                // PHA Implied
                case 0x48:
                    me.pushByte(A[0]);
                    PC[0] += 1;
                    cycles -= 3;
                    break;
                
                // PLA Implied
                case 0x68:
                    A[0] = me.popByte();
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 1;
                    cycles -= 4;
                    break;
                
                // LSR (Accumulator)
                case 0x4A:
                    P[0] = setBit(P[0], C_FLAG, testBit(A[0], 0));
                    A[0] = A[0] >> 1;
                    A[0] = setBit(A[0], 7, false);
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // ORA (Immediate)
                case 0x09:
                    ADDR[0] = PC[0] + 1;
                    TEMP[0] = me.readByte(ADDR[0]);
                    A[0] = A[0] | TEMP[0];
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 2;
                    cycles -= 2;
                    break;

                // ORA (Zero Page)
                case 0x05:
                    ADDR[0] = me.readByte(PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    A[0] = A[0] | TEMP[0];
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 2;
                    cycles -= 3;
                    break;

                // AND (Immediate)
                case 0x29:
                    TEMP[0] = me.readByte(PC[0] + 1);
                    A[0] = A[0] & TEMP[0];
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 2;
                    cycles -= 2;
                    break;

                // AND (Zero Page, X)
                case 0x35:
                    UTEMP[0] = X[0];
                    ADDR[0] = me.readByte(PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);
                    A[0] = A[0] & TEMP[0];
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 2;
                    cycles -= 4;
                    break;

                // EOR Immediate
                case 0x49:
                    A[0] = A[0] ^ me.readByte(PC[0] + 1);
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 2;
                    cycles -= 2;
                    break;

                // EOR (Zero Page, X);
                case 0x55:
                    UTEMP[0] = X[0];
                    ADDR[0] = me.readByte(PC[0] + 1) + UTEMP[0];
                    TEMP[0] = me.readByte(ADDR[0]);
                    A[0] = A[0] ^ TEMP[0];
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 2;
                    cycles -= 4;
                    break;

                // ROL (Zero Page)
                case 0x26:
                    ADDR[0] = me.readByte(PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);

                    TEMP2[0] = TEMP[0] << 1;
                    TEMP2[0] = setBit(TEMP2[0], 0, testBit(P[0], C_FLAG));
                    me.writeByte(ADDR[0], TEMP2[0]);
                    P[0] = setBit(P[0], C_FLAG, testBit(TEMP[0], 7));

                    PC[0] += 2;
                    cycles -= 5;
                    break;

                // ASL (Accumulator)
                case 0x0A:
                    P[0] = setBit(P[0], C_FLAG, testBit(A[0], 7));
                    A[0] = A[0] << 1;
                    A[0] = setBit(A[0], 0, false);
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // ASL (Zero Page)
                case 0x06:
                    ADDR[0] = me.readByte(PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    P[0] = setBit(P[0], C_FLAG, testBit(TEMP[0], 7));
                    TEMP[0] = TEMP[0] << 1;
                    TEMP[0] = setBit(TEMP[0], 0, false);
                    me.writeByte(ADDR[0], TEMP[0]);
                    P[0] = setBit(P[0], Z_FLAG, TEMP[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(TEMP[0], 7));

                    PC[0] += 2;
                    cycles -= 5;
                    break;

                // BIT (Zero Page)
                case 0x24:
                    ADDR[0] = me.readByte(PC[0] + 1);
                    TEMP[0] = me.readByte(ADDR[0]);
                    TEMP2[0] = TEMP[0] & A[0];
                    P[0] = setBit(P[0], Z_FLAG, TEMP2[0] == 0);
                    P[0] = setBit(P[0], V_FLAG, testBit(TEMP[0], 6));
                    P[0] = setBit(P[0], N_FLAG, testBit(TEMP[0], 7));

                    PC[0] += 2;
                    cycles -= 3;
                    break;

                // CBC (Implied)
                case 0x18:
                    P[0] = setBit(P[0], C_FLAG, false);
                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // ADC (Immediate)
                case 0x69:
                    UTEMP[0] = me.readByte(PC[0] + 1);
                    UTEMP2[0] = A[0];
                    var result = UTEMP[0] + UTEMP2[0] + (testBit(P[0], C_FLAG) ? 1 : 0);
                    P[0] = setBit(P[0], C_FLAG, result >= 0x100);
                    P[0] = setBit(P[0], V_FLAG, (~(A[0] ^ UTEMP[0]) & (A[0] ^ result) & 0x80) != 0);
                    A[0] = result;
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 2;
                    cycles -= 2;
                    break;

                // ADC (Zero Page)
                case 0x65:
                    ADDR[0] = me.readByte(PC[0] + 1);
                    UTEMP[0] = me.readByte(ADDR[0]);
                    UTEMP2[0] = A[0];
                    var result = UTEMP[0] + UTEMP2[0] + (testBit(P[0], C_FLAG) ? 1 : 0);
                    P[0] = setBit(P[0], C_FLAG, result >= 0x100);
                    P[0] = setBit(P[0], V_FLAG, (~(A[0] ^ UTEMP[0]) & (A[0] ^ result) & 0x80) != 0);
                    A[0] = result;
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 2;
                    cycles -= 3;
                    break;

                default:
                    throw('Invalid opcode: ' + opCode.toString(16));
                    return;
            };
        }
    };

    this.interrupt = function() {
        P[0] = setBit(P[0], I_FLAG, true);
        P[0] = setBit(P[0], U_FLAG, false);
        me.pushWord(PC[0]);
        me.pushByte(P[0]);
        PC[0] = me.readWord(0xFFFA);
    };

    this.pushByte = function(value) {
        me.writeByte(0x100 + SP[0], value);
        SP[0] -= 1;
    };

    this.pushWord = function(value) {
        me.writeWord(0xFF + SP[0], value);
        SP[0] -= 2;
    };

    this.popByte = function() {
        SP[0] += 1;
        return me.readByte(0x100 + SP[0]);
    };

    this.popWord = function() {
        SP[0] += 2;
        return me.readWord(0xFF + SP[0]);
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
                // Implement controller
                break;

            case 3:
                throw('Implement CPU RAM');
                break;

            default:
                memory[address] = value;
        }
    };

    this.readByte = function(address) {
        switch (address >> 13) {
            case 1:
                return ppu.readIO(address);
                break;

            case 2:
                // Implement controller
                return 0;
                break;

            case 3: 
                throw('Implement CPU RAM');
                break;

            default:
                return memory[address];
        }
    };

    this.writeWord = function(address, value) {
        me.writeByte(address, value & 0xFF);
        me.writeByte(address + 1, value >> 8);
    };

    this.readWord = function(address) {
        return me.readByte(address) + (me.readByte(address + 1) << 8);
    };

    this.loadPrgData = function(prgData) {
        memory.set(prgData, 0x8000);
    };

    this.init = function() {

    };

    this.reset = function() {
        PC[0] = me.readWord(0xFFFC);
        SP[0] -= 3;
    };
};
