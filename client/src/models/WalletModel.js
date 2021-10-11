const mongoose = require("mongoose");
const solanaweb3 = require('@solana/web3.js');
var Schema = mongoose.Schema;
var WalletDataSchema = new Schema(
    {
        _id: Schema.Types.ObjectId,
        keypair: Array,       
    });
var WalletData = mongoose.model('WalletData', WalletDataSchema,'wallets');
module.exports = WalletData;