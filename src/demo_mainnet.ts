import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  fetchAllPoolKeys,
  fetchPoolKeys,
  getRouteRelated,
} from "./util_mainnet";
import {
  getTokenAccountsByOwner,
  swap,
  addLiquidity,
  removeLiquidity,
  routeSwap,
  tradeSwap,
  getLiquidityInfo,
} from "./util";
import {
  TOKEN_PROGRAM_ID,
  SPL_ACCOUNT_LAYOUT,
  TokenAccount,
  LiquidityPoolKeys,
  Liquidity,
  Route,
  Trade,
  TokenAmount,
  Token,
  Percent,
  Currency,
  LIQUIDITY_STATE_LAYOUT_V4,
} from "@raydium-io/raydium-sdk";
import { OpenOrders } from "@project-serum/serum";

// @ts-ignore
import bs58 from "bs58";
import { SERUM_PROGRAM_ID_V3 } from "@raydium-io/raydium-sdk";

const fetchPoolPrice = async (
  connection: Connection,
  poolID: string,
  log: boolean = false
): Promise<number> => {
  
  const poolPubKey = new PublicKey(poolID);
  const info = await connection.getAccountInfo(poolPubKey);
  if (info === null) {
    throw new Error("Could not connect to the pool!");
  }
  const state = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
  const baseTokenAmount = await connection.getTokenAccountBalance(
    state.baseVault
  );
  if (log) console.log("Base Token Amount: ", baseTokenAmount);

  const quoteTokenAmount = await connection.getTokenAccountBalance(
    state.quoteVault
  );
  if (log) console.log("Quote Token Amount: ", quoteTokenAmount);
  const openOrders = await OpenOrders.load(
    connection,
    state.openOrders,
    SERUM_PROGRAM_ID_V3
  );
  if (log) console.log("Open orders: ", openOrders);

  const baseDecimal = 10 ** state.baseDecimal.toNumber();
  const quoteDecimal = 10 ** state.quoteDecimal.toNumber();
  if (log) console.log("Base decimal: ", baseDecimal);
  if (log) console.log("Quote decimal: ", quoteDecimal);

  const openOrdersTotalBase = openOrders.baseTokenTotal.toNumber() / baseDecimal;
  if (log) console.log("openOrdersTotalBase: ", openOrdersTotalBase);

  const openOrdersTotalQuote = openOrders.quoteTokenTotal.toNumber() / quoteDecimal;
  if (log) console.log("openOrdersTotalQuote: ", openOrdersTotalQuote);

  const basePnl = state.baseNeedTakePnl.toNumber() / baseDecimal;
  if (log) console.log("basePnl: ", basePnl);

  const quotePnl = state.quoteNeedTakePnl.toNumber() / quoteDecimal;
  if (log) console.log("quotePnl: ", quotePnl);

  const base = baseTokenAmount.value.uiAmount! + openOrdersTotalBase - basePnl;
  if (log) console.log("base: ", base);

  const quote = quoteTokenAmount.value.uiAmount! + openOrdersTotalQuote - quotePnl;
  if (log) console.log("quote: ", quote);

  if (log) console.log("Price: ", quote / base);
  return quote / base;
};

(async () => {
  const connection = new Connection(
    "https://solana-api.projectserum.com",
    "confirmed"
  );

  const secretKey = bs58.decode(
    "2vTyWKgs2NZdzoJzfmnVARrzofHiWojZ8bG5JuczUouTPswy99P36CeurbPYfG7ijdniT6gqjfXCWD5dVdN5uJac"
  );

  const raydium = "7XawhbbxtsRcQA8KTkHT9f9nc6d69UwqCDh6U5EEbEmX";
  const orca = "HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1";

  while (true) {
    // console.log("Orca: SOL-USDT", await fetchPoolPrice(connection, orca));
    console.log("Raydium: SOL-USDT", await fetchPoolPrice(connection, raydium));
  }

})();
