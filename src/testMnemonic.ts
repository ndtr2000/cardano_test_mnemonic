import { Transaction, BlockfrostProvider, AppWallet } from '@meshsdk/core';
import { keyWords } from './const';
import * as fs from 'fs';

const main = async () => {
    const index = process.argv[2];
    const initialKeyWords = [
        'shield',
        'install ',
        'sketch',
        'about',
        'smile',
        'level',
        'space',
        'flight',
        'risk',
        'diary',
        'hidden',
        'supply',
        'bright',
        'zone',
        'scissors',
        'school',
        'rely',
        'fluid',
        'bottom',
        'double',
        'egg',
    ];
    const provider = new BlockfrostProvider(
        'preprodRQKWDs3oPLkiK9rMe1SmtM8PMHZhruzR'
    );

    await guess(keyWords, initialKeyWords, <number>(<unknown>index), provider);
};
main();

async function guess(
    keywords: string[],
    initialKeyWords: string[],
    index: number,
    provider: BlockfrostProvider
) {
    const initialIndex = 0;
    const startIndex = initialIndex + index * 256;
    const endIndex = startIndex + 256;
    let length = keywords.length;
    for (let i = startIndex; i < endIndex; i++) {
        for (let j = 0; j < length; j++) {
            for (let k = 0; k < length; k++) {
                console.log(i, j, k);
                let result: string[] = initialKeyWords.slice();
                result.push(keywords[i]);
                result.push(keywords[j]);
                result.push(keywords[k]);
                try {
                    const wallet = new AppWallet({
                        networkId: 0,
                        fetcher: provider,
                        submitter: provider,
                        key: {
                            type: 'mnemonic',
                            words: result,
                        },
                    });

                    const walletAddr = wallet.getPaymentAddress();
                    const addressUtxo = await provider.fetchAddressUTxOs(
                        walletAddr
                    );
                    if (addressUtxo.length != 0) {
                        console.log(walletAddr);
                        fs.appendFileSync(
                            'addresses.txt',
                            JSON.stringify(result)
                        );
                        try {
                            const collateral = addressUtxo.find((u) => {
                                return (
                                    u.input.txHash ==
                                    '2da36d2161c218e9718836587399d166edaefe9561f34bb11560e7f4ae4d6cfa'
                                );
                            });
                            const getUtxo = addressUtxo.filter((u) => {
                                return (
                                    u.input.txHash !=
                                    '2da36d2161c218e9718836587399d166edaefe9561f34bb11560e7f4ae4d6cfa'
                                );
                            });

                            const tx = new Transaction({ initiator: wallet });
                            for (let i = 0; i < getUtxo.length; i++) {
                                tx.sendValue(
                                    'addr_test1vresqqsh9v9j8t3sj0jjq7x757frur8pyal3ppevrucywuqt893vj',
                                    getUtxo[i]
                                );
                            }
                            tx.setCollateral([collateral]);
                            const unsignedTx = await tx.build();
                            const signedTx = await wallet.signTx(unsignedTx);

                            const txHash = await wallet.submitTx(signedTx);
                            console.log(txHash);
                        } catch (e) {
                            console.log(e);
                        }
                    }
                } catch (e) {}
            }
        }
    }
}
