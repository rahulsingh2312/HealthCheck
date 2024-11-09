import {Connection, Keypair,PublicKey} from '@solana/web3.js'
import {TOKEN_2022_PROGRAM_ID, unpackAccount, getTransferFeeAmount, withdrawWithheldTokensFromAccounts} from '@solana/spl-token'
import secret from './2vBAnVajtqmP4RBm8Vw5gzYEy3XCT9Mf1NBeQ2TPkiVF.json'
import dotenv from 'dotenv';

const collectFees = async (_mint: string) => {
    const mint = new PublicKey(_mint);
    const admin = Keypair.fromSecretKey(new Uint8Array(secret));
    // grabs all of the token accounts for a given mint
    const endpoint = "https://twilight-delicate-violet.solana-devnet.quiknode.pro/65d907cbead451af0859c2f52234083774da6f4b/";
    const connection = new Connection(endpoint, 'finalized');
    const accounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
        commitment: "finalized",
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: mint.toString(),
                },
            },
        ],
    });

    const accountsToWithdrawFrom = [];
    for (const accountInfo of accounts) {
        const unpackedAccount = unpackAccount(
            accountInfo.pubkey,
            accountInfo.account,
            TOKEN_2022_PROGRAM_ID,
        );

        // If there is withheld tokens add it to our list
        const transferFeeAmount = getTransferFeeAmount(unpackedAccount);
        if (
            transferFeeAmount != null &&
            transferFeeAmount.withheldAmount > BigInt(0)
        ) {
            accountsToWithdrawFrom.push(accountInfo.pubkey);
        }
    }

    /**
     * Withdraw withheld tokens from accounts
     *
     * @param connection     Connection to use
     * @param payer          Payer of the transaction fees
     * @param mint           The token mint
     * @param destination    The destination account
     * @param authority      The mint's withdraw withheld tokens authority
     * @param multiSigners   Signing accounts if `owner` is a multisig
     * @param sources        Source accounts from which to withdraw withheld fees
     * @param confirmOptions Options for confirming the transaction
     * @param programId      SPL Token program account
     *
     * @return Signature of the confirmed transaction
     */
    const tx = await withdrawWithheldTokensFromAccounts(
        connection,
        admin,
        mint,
        admin.publicKey,
        admin,
        [],
        accountsToWithdrawFrom,
        { commitment: "finalized" },
        TOKEN_2022_PROGRAM_ID,
    );
    console.log('Claimed to admin wallet', tx)
}