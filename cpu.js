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
    me.prgData = undefined;
    var count = 0;

    var addressModes = {
        immediate: function() {
            return me.PC[0] + 1;
        },

        zeroPage: function() {
            return me.readByte(me.PC[0] + 1);
        },

        zeroPageX: function() {
            UTEMP[0] = me.X[0];
            var a = me.readByte(me.PC[0] + 1);
            return (a + UTEMP[0]) & 0xFF;
        },

        zeroPageY: function() {
            UTEMP[0] = me.Y[0];
            var a = me.readByte(me.PC[0] + 1);
            return (a + UTEMP[0]) & 0xFF;
        },

        absolute: function() {
            return me.readWord(me.PC[0] + 1);
        },

        absoluteX: function() {
            UTEMP[0] = me.X[0];
            var a = me.readWord(me.PC[0] + 1);
            return (a + UTEMP[0]) & 0xFFFF;
        },

        absoluteY: function() {
            UTEMP[0] = me.Y[0];
            var a = me.readWord(me.PC[0] + 1);
            return (a + UTEMP[0]) & 0xFFFF;
        },

        indirectX: function() {
            var a = me.readByte(me.PC[0] + 1);
            return ((me.readByte((a + me.X[0] + 1) & 0xFF) << 8) + me.readByte((a + me.X[0]) & 0xFF)) & 0xFFFF;
        },

        indirectY: function() {
            UTEMP[0] = me.Y[0];
            var a = me.readByte(me.PC[0] + 1);
            return ((me.readByte((a + 1) & 0xFF) << 8) + me.readByte(a) + UTEMP[0]) & 0xFFFF;
        },

        relative: function() {
            TEMP[0] = me.readByte(me.PC[0] + 1);
            return (TEMP[0] + me.PC[0]) & 0xFFFF;
        },
    };

    var instructions = {
        lda: function(address) {
            me.A[0] = me.readByte(address);
            me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));
        },

        ldx: function(address) {
            me.X[0] = me.readByte(address);
            me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));
        },

        ldy: function(address) {
            me.Y[0] = me.readByte(address);
            me.P[0] = setBit(me.P[0], Z_FLAG, me.Y[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.Y[0], 7));
        },

        sta: function(address) {
            me.writeByte(address, me.A[0]);
        },

        stx: function(address) {
            me.writeByte(address, me.X[0]);
        },

        sty: function(address) {
            me.writeByte(address, me.Y[0]);
        },

        txs: function() {
            me.SP[0] = me.X[0];
        },

        tay: function() {
            me.Y[0] = me.A[0];
            me.P[0] = setBit(me.P[0], Z_FLAG, me.Y[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.Y[0], 7));
        },

        tax: function() {
            me.X[0] = me.A[0]; 
            me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));
        },

        tya: function() {
            me.A[0] = me.Y[0];
            me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));
        },

        txa: function() {
            me.A[0] = me.X[0];
            me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));
        },

        tsx: function() {
            me.X[0] = me.SP[0];
            me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));
        },

        inx: function() {
            me.X[0] += 1;
            me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));
        },

        iny: function() {
            me.Y[0] += 1;
            me.P[0] = setBit(me.P[0], Z_FLAG, me.Y[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.Y[0], 7));
        },

        inc: function(address) {
            TEMP[0] = me.readByte(address);
            TEMP[0] += 1;
            me.writeByte(address, TEMP[0]);
            me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));
        },

        dex: function() {
            me.X[0] -= 1;
            me.P[0] = setBit(me.P[0], Z_FLAG, me.X[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.X[0], 7));
        },

        dey: function() {
            me.Y[0] -= 1;
            me.P[0] = setBit(me.P[0], Z_FLAG, me.Y[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.Y[0], 7));
        },

        dec: function(address) {
            TEMP[0] = me.readByte(address);
            TEMP[0] -= 1;
            me.writeByte(address, TEMP[0]);
            me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));
        },

        branch: function(expression, address) {
            if (expression) {
                me.PC[0] = address;
            }
        },

        cmp: function(address) {
            UTEMP[0] = me.A[0];
            var result = UTEMP[0] - me.readByte(address);
            me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
            me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));
        },

        cpx: function(address) {
            UTEMP[0] = me.X[0];
            var result = UTEMP[0] - me.readByte(address);
            me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
            me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));
        },

        cpy: function(address) {
            UTEMP[0] = me.Y[0];
            var result = UTEMP[0] - me.readByte(address);
            me.P[0] = setBit(me.P[0], C_FLAG, result >= 0);
            me.P[0] = setBit(me.P[0], Z_FLAG, result == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(result, 7));
        },

        pla: function() {
            me.A[0] = me.popByte();
            me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));
        },

        lsr: function(address) {
            if (address == undefined) {
                me.P[0] = setBit(me.P[0], C_FLAG, testBit(me.A[0], 0));
                me.A[0] = me.A[0] >> 1;
                me.A[0] = setBit(me.A[0], 7, false);
                me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
                me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));
            }
            else {
                UTEMP[0] = me.readByte(address);
                me.P[0] = setBit(me.P[0], C_FLAG, testBit(UTEMP[0], 0));
                UTEMP[0] = UTEMP[0] >> 1;
                UTEMP[0] = setBit(UTEMP[0], 7, false);
                me.writeByte(address, UTEMP[0]);
                me.P[0] = setBit(me.P[0], Z_FLAG, UTEMP[0] == 0);
                me.P[0] = setBit(me.P[0], N_FLAG, testBit(UTEMP[0], 7));
            }
        },

        ora: function(address) {
            TEMP[0] = me.readByte(address);
            me.A[0] = me.A[0] | TEMP[0];
            me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));
        },

        and: function(address) {
            TEMP[0] = me.readByte(address);
            me.A[0] = me.A[0] & TEMP[0];
            me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));
        },

        eor: function(address) {
            TEMP[0] = me.readByte(address);
            me.A[0] = me.A[0] ^ TEMP[0];
            me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));
        },

        ror: function(address) {
            if (address == undefined) {
                TEMP[0] = me.A[0] >> 1;
                TEMP[0] = setBit(TEMP[0], 7, testBit(me.P[0], C_FLAG));
                me.P[0] = setBit(me.P[0], C_FLAG, testBit(me.A[0], 0));
                me.A[0] = TEMP[0];
                me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));
            }
            else {
                TEMP[0] = me.readByte(address);
                TEMP2[0] = TEMP[0] >> 1;
                TEMP2[0] = setBit(TEMP2[0], 7, testBit(me.P[0], C_FLAG));
                me.writeByte(address, TEMP2[0]);
                me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 0));
                me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP2[0], 7));
            }
        },
        
        rol: function(address) {
            if (address == undefined) {
                TEMP[0] = me.A[0] << 1;
                TEMP[0] = setBit(TEMP[0], 0, testBit(me.P[0], C_FLAG));
                me.P[0] = setBit(me.P[0], C_FLAG, testBit(me.A[0], 7));
                me.A[0] = TEMP[0];
                me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));
            }
            else {
                TEMP[0] = me.readByte(address);
                TEMP2[0] = TEMP[0] << 1;
                TEMP2[0] = setBit(TEMP2[0], 0, testBit(me.P[0], C_FLAG));
                me.writeByte(address, TEMP2[0]);
                me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 7));
                me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP2[0], 7));
            }
        },

        asl: function(address) {
            TEMP[0] = me.readByte(address);
            me.P[0] = setBit(me.P[0], C_FLAG, testBit(TEMP[0], 7));
            TEMP[0] = TEMP[0] << 1;
            TEMP[0] = setBit(TEMP[0], 0, false);
            me.writeByte(address, TEMP[0]);
            me.P[0] = setBit(me.P[0], Z_FLAG, TEMP[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));
        },

        bit: function(address) {
            TEMP[0] = me.readByte(address);
            TEMP2[0] = TEMP[0] & me.A[0];
            me.P[0] = setBit(me.P[0], Z_FLAG, TEMP2[0] == 0);
            me.P[0] = setBit(me.P[0], V_FLAG, testBit(TEMP[0], 6));
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(TEMP[0], 7));
        },

        adc: function(address) {
            UTEMP[0] = me.readByte(address);
            UTEMP2[0] = me.A[0];
            var result = UTEMP[0] + UTEMP2[0] + (testBit(me.P[0], C_FLAG) ? 1 : 0);
            me.P[0] = setBit(me.P[0], C_FLAG, result >= 0x100);
            me.P[0] = setBit(me.P[0], V_FLAG, (~(me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
            me.A[0] = result;
            me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));
        },

        sbc: function(address) {
            UTEMP[0] = me.readByte(address);
            UTEMP2[0] = me.A[0];
            var result = UTEMP2[0] - UTEMP[0] - (testBit(me.P[0], C_FLAG) ? 0 : 1);
            me.P[0] = setBit(me.P[0], C_FLAG, (result & 0x100) == 0);
            me.P[0] = setBit(me.P[0], V_FLAG, ((me.A[0] ^ UTEMP[0]) & (me.A[0] ^ result) & 0x80) != 0);
            me.A[0] = result;
            me.P[0] = setBit(me.P[0], Z_FLAG, me.A[0] == 0);
            me.P[0] = setBit(me.P[0], N_FLAG, testBit(me.A[0], 7));

        },
    };

    this.getCount = function() {
        return count;
    };

    this.run = function(cycles) {
        var prevOpCode = null;

        while (cycles > 0) {
            count++;
            var opCode = me.readByte(me.PC[0]);
            if (opCode == undefined) {
                console.log('No opcode T_T ' + me.PC[0].toString(16));
            }
            //console.log(me.PC[0].toString(16) + ', ' + opCode.toString(16));

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
                // BRK 
                /*
                case 0x00:
                    //me.P[0] = setBit(me.P[0], I_FLAG, true);
                    me.pushWord(me.PC[0]);
                    me.pushByte(me.P[0]);
                    me.P[0] = setBit(me.P[0], B_FLAG);
                    me.P[0] = setBit(me.P[0], I_FLAG);
                    me.PC[0] = me.readWord(0xFFFE);
                    cycles -= 7;
                    break;
                    */

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

                // SEI Implied
                case 0x78:
                    me.P[0] = setBit(me.P[0], I_FLAG, true);
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // SEC Implied
                case 0x38:
                    me.P[0] = setBit(me.P[0], C_FLAG, true);
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // SED Implied
                case 0xF8:
                    me.P[0] = setBit(me.P[0], D_FLAG, true);
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // CLD Implied
                case 0xD8:
                    me.P[0] = setBit(me.P[0], D_FLAG, false);
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // CBC Implied
                case 0x18:
                    me.P[0] = setBit(me.P[0], C_FLAG, false);
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // CLV Implied
                case 0xB8:
                    me.P[0] = setBit(me.P[0], V_FLAG, false);
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // CLI Implied
                case 0x58:
                    me.P[0] = setBit(me.P[0], I_FLAG, false);
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // LDA Immediate
                case 0xA9:
                    instructions.lda(addressModes.immediate());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // LDA Zero Page
                case 0xA5:
                    instructions.lda(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // LDA Zero Page, X
                case 0xB5:
                    instructions.lda(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // LDA Absolute
                case 0xAD:
                    instructions.lda(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // LDA Absolute, X
                case 0xBD:
                    instructions.lda(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // LDA Absolute, Y
                case 0xB9:
                    instructions.lda(addressModes.absoluteY());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // LDA Indirect, X
                case 0xA1:
                    instructions.lda(addressModes.indirectX());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // LDA Indirect, Y
                case 0xB1:
                    instructions.lda(addressModes.indirectY());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // LDX Immediate
                case 0xA2:
                    instructions.ldx(addressModes.immediate());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // LDX Zero Page
                case 0xA6:
                    instructions.ldx(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // LDX Zero Page, Y
                case 0xB6:
                    instructions.ldx(addressModes.zeroPageY());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // LDX Absolute
                case 0xAE:
                    instructions.ldx(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // LDX Absolute, Y
                case 0xBE:
                    instructions.ldx(addressModes.absoluteY());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // LDY Immediate
                case 0xA0:
                    instructions.ldy(addressModes.immediate());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // LDY Zero Page
                case 0xA4:
                    instructions.ldy(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // LDY Zero Page, X
                case 0xB4:
                    instructions.ldy(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // LDY Absolute
                case 0xAC:
                    instructions.ldy(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // LDY (Absolute, X)
                case 0xBC:
                    instructions.ldy(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // BVS Relative
                case 0x70:
                    instructions.branch(testBit(me.P[0], V_FLAG), addressModes.relative());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // BVC Relative
                case 0x50:
                    instructions.branch(!testBit(me.P[0], V_FLAG), addressModes.relative());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // BEQ Relative
                case 0xF0:
                    instructions.branch(testBit(me.P[0], Z_FLAG), addressModes.relative());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // BNE Relative
                case 0xD0:
                    instructions.branch(!testBit(me.P[0], Z_FLAG), addressModes.relative());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;
                
                // BCC Relative 
                case 0x90:
                    instructions.branch(!testBit(me.P[0], C_FLAG), addressModes.relative());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;
                
                // BCS Relative 
                case 0xB0:
                    instructions.branch(testBit(me.P[0], C_FLAG), addressModes.relative());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // BPL Relative
                case 0x10:
                    instructions.branch(!testBit(me.P[0], N_FLAG), addressModes.relative());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // BMI Relative 
                case 0x30:
                    instructions.branch(testBit(me.P[0], N_FLAG), addressModes.relative());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // TXS Implied
                case 0x9A:
                    instructions.txs();
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // TSX Implied
                case 0xBA:
                    instructions.tsx();
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // INX Implied
                case 0xE8:
                    instructions.inx();
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // INC Zero Page
                case 0xE6:
                    instructions.inc(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // INC Zero Page, X
                case 0xF6:
                    instructions.inc(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // INC Absolute
                case 0xEE:
                    instructions.inc(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // INC Absolute, X
                case 0xFE:
                    instructions.inc(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 7;
                    break;

                // STA Zero Page
                case 0x85:
                    instructions.sta(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // STA Zero Page, X
                case 0x95:
                    instructions.sta(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // STA Absolute
                case 0x8D:
                    instructions.sta(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // STA Absolute, X
                case 0x9D:
                    instructions.sta(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 5;
                    break;

                // STA Absolute, Y
                case 0x99:
                    instructions.sta(addressModes.absoluteY());
                    me.PC[0] += 3;
                    cycles -= 5;
                    break;

                // STA Indirect, X
                case 0x81:
                    instructions.sta(addressModes.indirectX());
                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // STA Indirect, Y
                case 0x91:
                    instructions.sta(addressModes.indirectY());
                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // TXA Implied
                case 0x8A:
                    instructions.txa();
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // TAY Implied
                case 0xA8:
                    instructions.tay();
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // STX Zero Page
                case 0x86:
                    instructions.stx(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // STX Zero Page, Y
                case 0x96:
                    instructions.stx(addressModes.zeroPageY());
                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // STX Absolute
                case 0x8E:
                    instructions.stx(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // STY Zero Page
                case 0x84:
                    instructions.sty(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // STY Zero Page, X
                case 0x94:
                    instructions.sty(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // STY Absolute
                case 0x8C:
                    instructions.sty(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // INY Implied
                case 0xC8:
                    instructions.iny();
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // DEC Zero Page
                case 0xC6:
                    instructions.dec(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // DEC Zero Page, X
                case 0xD6:
                    instructions.dec(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // DEC Absolute
                case 0xCE:
                    instructions.dec(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // DEC Absolute, X
                case 0xDE:
                    instructions.dec(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // DEX Implied
                case 0xCA:
                    instructions.dex();
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // DEY Implied
                case 0x88:
                    instructions.dey();
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // TAX Implied
                case 0xAA:
                    instructions.tax();
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;
                
                // TYA Implied
                case 0x98:
                    instructions.tya();
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // CMP Immediate
                case 0xC9:
                    instructions.cmp(addressModes.immediate());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // CMP Zero Page
                case 0xC5:
                    instructions.cmp(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // CMP Zero Page, X
                case 0xD5:
                    instructions.cmp(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // CMP Absolute
                case 0xCD:
                    instructions.cmp(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // CMP Absolute, X
                case 0xDD:
                    instructions.cmp(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // CMP Absolute, Y
                case 0xD9:
                    instructions.cmp(addressModes.absoluteY());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // CMP Indirect, X
                case 0xC1:
                    instructions.cmp(addressModes.indirectX());
                    me.PC[0] += 2;
                    cycles -= 6;
                    break;
                    
                // CMP Indirect, Y
                case 0xD1:
                    instructions.cmp(addressModes.indirectY());
                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // CPX Immediate
                case 0xE0:
                    instructions.cpx(addressModes.immediate());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // CPX Zero Page
                case 0xE4:
                    instructions.cpx(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // CPX Absolute
                case 0xEC:
                    instructions.cpx(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // CPY Immediate
                case 0xC0:
                    instructions.cpy(addressModes.immediate());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // CPY Zero Page
                case 0xC4:
                    instructions.cpy(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // CPY Absolute
                case 0xCC:
                    instructions.cpy(addressModes.absolute());
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
                    instructions.pla();
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
                
                // LSR Accumulator
                case 0x4A:
                    instructions.lsr();
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // LSR Zero Page
                case 0x46:
                    instructions.lsr(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // LSR Zero Page, X
                case 0x56:
                    instructions.lsr(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // LSR Absolute
                case 0x4E:
                    instructions.lsr(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // LSR Absolute, X
                case 0x5E:
                    instructions.lsr(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // ORA Immediate
                case 0x09:
                    instructions.ora(addressModes.immediate());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // ORA Zero Page
                case 0x05:
                    instructions.ora(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // ORA Zero Page, X
                case 0x15:
                    instructions.ora(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // ORA Absolute
                case 0x0D:
                    instructions.ora(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ORA Absolute, X
                case 0x1D:
                    instructions.ora(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ORA Absolute, Y
                case 0x19:
                    instructions.ora(addressModes.absoluteY());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ORA Indirect, X
                case 0x01:
                    instructions.ora(addressModes.indirectX());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ORA Indirect, Y
                case 0x11:
                    instructions.ora(addressModes.indirectY());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // AND Immediate
                case 0x29:
                    instructions.and(addressModes.immediate());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;
                    
                // AND Zero Page
                case 0x25:
                    instructions.and(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;


                // AND Zero Page, X
                case 0x35:
                    instructions.and(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 4;
                    break;
                    
                // AND Absolute
                case 0x2D:
                    instructions.and(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // AND Absolute, X
                case 0x3D:
                    instructions.and(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // AND Absolute, Y
                case 0x39:
                    instructions.and(addressModes.absoluteY());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // AND Indirect, X
                case 0x21:
                    instructions.and(addressModes.indirectX());
                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // AND (Indirect, Y)
                case 0x31:
                    instructions.and(addressModes.indirectY());
                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // EOR Immediate
                case 0x49:
                    instructions.eor(addressModes.immediate());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // EOR Zero Page
                case 0x45:
                    instructions.eor(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // EOR Zero Page, X
                case 0x55:
                    instructions.eor(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // EOR Absolute
                case 0x4D:
                    instructions.eor(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // EOR Absolute, X
                case 0x5D:
                    instructions.eor(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // EOR Absolute, Y
                case 0x59:
                    instructions.eor(addressModes.absoluteY());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // EOR Indirect, X
                case 0x41:
                    instructions.eor(addressModes.indirectX());
                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // EOR Indirect, Y
                case 0x51:
                    instructions.eor(addressModes.indirectY());
                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // ROR Accumulator
                case 0x6A:
                    instructions.ror();
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // ROR Zero Page
                case 0x66:
                    instructions.ror(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ROR Zero Page, X
                case 0x76:
                    instructions.ror(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ROR Absolute
                case 0x6E:
                    instructions.ror(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // ROR Absolute, X
                case 0x7E:
                    instructions.ror(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 7;
                    break;

                // ROL Accumulator
                case 0x2A:
                    instructions.rol();
                    me.PC[0] += 1;
                    cycles -= 2;
                    break;

                // ROL Zero Page
                case 0x26:
                    instructions.rol(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ROL Zero Page, X
                case 0x36:
                    instructions.rol(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ROL Absolute
                case 0x2E:
                    instructions.rol(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // ROL Absolute, X
                case 0x3E:
                    instructions.rol(addressModes.absoluteX());
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

                // ASL Zero Page
                case 0x06:
                    instructions.asl(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ASL Zero Page, X
                case 0x16:
                    instructions.asl(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // ASL Absolute
                case 0x0E:
                    instructions.asl(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // ASL Absolute, X
                case 0x1E:
                    instructions.asl(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 6;
                    break;

                // BIT Zero Page
                case 0x24:
                    instructions.bit(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // BIT Absolute
                case 0x2C:
                    instructions.bit(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ADC Immediate
                case 0x69:
                    instructions.adc(addressModes.immediate());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // ADC Zero Page
                case 0x65:
                    instructions.adc(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // ADC Zero Page, X
                case 0x75:
                    instructions.adc(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // ADC Absolute
                case 0x6D:
                    instructions.adc(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ADC Absolute, X
                case 0x7D:
                    instructions.adc(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ADC Absolute, Y
                case 0x79:
                    instructions.adc(addressModes.absoluteY());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // ADC Indirect, X
                case 0x61:
                    instructions.adc(addressModes.indirectX());
                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // ADC Indirect, Y
                case 0x71:
                    instructions.adc(addressModes.indirectY());
                    me.PC[0] += 2;
                    cycles -= 6;
                    break;

                // SBC Immediate
                case 0xE9:
                    instructions.sbc(addressModes.immediate());
                    me.PC[0] += 2;
                    cycles -= 2;
                    break;

                // SBC Zero Page
                case 0xE5:
                    instructions.sbc(addressModes.zeroPage());
                    me.PC[0] += 2;
                    cycles -= 3;
                    break;

                // SBC Zero Page, X
                case 0xF5:
                    instructions.sbc(addressModes.zeroPageX());
                    me.PC[0] += 2;
                    cycles -= 4;
                    break;

                // SBC Absolute
                case 0xED:
                    instructions.sbc(addressModes.absolute());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // SBC Absolute, X
                case 0xFD:
                    instructions.sbc(addressModes.absoluteX());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // SBC Absolute, Y
                case 0xF9:
                    instructions.sbc(addressModes.absoluteY());
                    me.PC[0] += 3;
                    cycles -= 4;
                    break;

                // SBC Indirect, X
                case 0xE1:
                    instructions.sbc(addressModes.indirectX());
                    me.PC[0] += 2;
                    cycles -= 5;
                    break;

                // SBC Indirect, Y
                case 0xF1:
                    instructions.sbc(addressModes.indirectY());
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

            prevOpCode = opCode;
        }
    };

    this.interrupt = function() {
        me.pushWord(me.PC[0]);
        me.pushByte(me.P[0]);
        me.P[0] = setBit(me.P[0], I_FLAG, true);
        me.PC[0] = me.readWord(0xFFFA);
    };

    this.irqInterrupt = function() {
        if (!testBit(me.P[0], I_FLAG)) {
            me.pushWord(me.PC[0]);
            me.pushByte(me.P[0]);
            me.P[0] = setBit(me.P[0], I_FLAG, true);
            me.PC[0] = me.readWord(0xFFFE);
        }
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
        if (address < 0x2000) {
            me.memory[address % 0x0800] = value;
        }
        else if (address < 0x4000) {
            ppu.writeIO(0x2000 + address % 0x08, value);
        }
        else if (address < 0x4018) {
            controller.writeIO(address, value);

            if (address == 0x4014) {
                value = value << 8;
                for (var i = 0; i < 256; i++) {
                    ppu.oamWriteByte(me.readByte(value + i));
                }
            }
        }
        else if (address < 0x4020) {
            // APU
        }
        else if (address < 0x10000) {
            memoryMapper.writeByte(address, value);
            //me.memory[address] = value;
        }
        else {
            throw('Invalid cpu memory address - ' + address.toString(16)); 
        }
    };

    this.readByte = function(address) {
        if (address < 0x2000) {
            return me.memory[address % 0x0800];   
        }
        else if (address < 0x4000) {
            return ppu.readIO(0x2000 + address % 0x08);
        }
        else if (address < 0x4018) {
            return controller.readIO(address); 
        }
        else if (address < 0x4020) {
            // APU
        }
        else if (address < 0x10000) {
            return memoryMapper.readByte(address);
            //return me.memory[address];
        }
        else {
            throw('Invalid cpu memory address - ' + address.toString(16)); 
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
        me.SP[0] = 0xFD;
    };
};
