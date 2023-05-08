import {
    PlutusScript,
    resolvePlutusScriptAddress,
    resolvePaymentKeyHash,
    Transaction,
    BlockfrostProvider,
    AppWallet,
    UTxO,
    resolveDataHash,
    Data,
    resolvePlutusScriptHash,
    resolveRewardAddress,
    resolveStakeKeyHash,
} from '@meshsdk/core';
import { BlockfrostAdapter, NetworkId } from '@minswap/blockfrost-adapter';
import * as fs from 'fs';

import { WingRidersAdapter } from '@wingriders/dex-blockfrost-adapter';

import { addressMap } from '../lpAddressMap';

const main = async () => {
    // Minswap
    const api = new BlockfrostAdapter({
        projectId: 'mainnetNZH5OCdpsfuOjJjUiEbF0NyuJZI8OSsE',
        networkId: NetworkId.MAINNET,
    });

    // Find poolID
    // for (let i = 1; ; i++) {
    //     // const pools = await api.getPools({ page: i });
    //     // if (pools.length === 0) {
    //     //     // last page
    //     //     break;
    //     // }
    //     // const minADAPool = pools.find(
    //     //     (p) =>
    //     //         p.assetA === 'lovelace' &&
    //     //         p.assetB ===
    //     //             '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e'
    //     // );

    // }

    // Get pool state
    const minADAPool = await api.getPoolById({
        id: '6aa2153e1ae896a95539c9d62f76cedcdabdcdf144e564b8955f609d660cf6a2',
    });

    const [a, b] = await api.getPoolPrice({ pool: minADAPool! });
    console.log(minADAPool!.reserveA);
    console.log(minADAPool!.reserveB);
    console.log(
        `ADA/MIN price: ${a.toString()}; MIN/ADA price: ${b.toString()}`
    );
    // we can later use this ID to call getPoolById
    console.log(`ADA/MIN pool ID: ${minADAPool!.id}`);

    // Wingrider
    const wingAdapter = new WingRidersAdapter({
        projectId: 'mainnetNZH5OCdpsfuOjJjUiEbF0NyuJZI8OSsE',
        lpAddressMap: addressMap,
    });

    // Get pool state
    const adaWrtLP =
        addressMap[
            '82e2b1fd27a7712a1a9cf750dfbea1a5778611b20e06dd6a611df7a643f8cb75'
        ];
    let vpool = await wingAdapter.getLiquidityPoolState(
        adaWrtLP.unitA,
        adaWrtLP.unitB
    );
    console.log(vpool);

    let price: any = await wingAdapter.getAdaPrice(
        '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e'
    );

    if (a > price) {
        console.log(
            calOptimizeX1In_2(
                Number(minADAPool?.reserveA!),
                Number(minADAPool?.reserveB!),
                Number(vpool.quantityA),
                Number(vpool.quantityB),
                0.997
            )
        );
    } else {
        console.log(
            calOptimizeX1In_2(
                Number(vpool.quantityA),
                Number(vpool.quantityB),
                Number(minADAPool?.reserveA!),
                Number(minADAPool?.reserveB!),
                0.997
            )
        );
    }
};

//https://cexplorer.io/datum/3eba824a21633db0bf498756194444c26c9a36baf187747c2ce0062e602f453c

const calOptimizeX1In = (
    x1: number,
    y1: number,
    a1: number,
    x2: number,
    y2: number,
    a2: number
) => {
    return (
        (Math.sqrt((x1 * x2 * y1 * y2 * a2) / a1) - (x1 * y2) / a1) / (y1 + y2)
    );
};

const calOptimizeX1In_2 = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    a: number
) => {
    return (Math.sqrt(x1 * x2 * y1 * y2) - (x1 * y2) / a) / (y1 + a * y2);
};
