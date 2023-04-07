import { Transaction, BlockfrostProvider, AppWallet } from '@meshsdk/core';
import { keyWords, initialKeyWords } from './const';
import * as fs from 'fs';

const main = async () => {
    const index = process.argv[2];

    const provider = new BlockfrostProvider(
        'mainnetNZH5OCdpsfuOjJjUiEbF0NyuJZI8OSsE'
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
    const startIndex = initialIndex + index * 44;
    const endIndex = startIndex + 44;
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
                                    'ee4eac3c62bf5f2e5ec8fcfd3f696f3ce241a4cb54bff345b121859e45253798'
                                );
                            });
                            const getUtxo = addressUtxo.filter((u) => {
                                return (
                                    u.input.txHash !=
                                    'ee4eac3c62bf5f2e5ec8fcfd3f696f3ce241a4cb54bff345b121859e45253798'
                                );
                            });

                            const tx = new Transaction({ initiator: wallet });
                            for (let i = 0; i < getUtxo.length; i++) {
                                tx.sendValue(
                                    'addr1q8g0sv8wppqm26948umyguer5flgtvrnlvhsd3229qft9lzqhfxczx3hvc02cmcqaek20zajpdfdfl07328jqpzmwjzqp9epmg',
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
