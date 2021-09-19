import * as React from "react";
import { useEffect, useState } from "react";
import { Link as ReactRouterLink} from "react-router-dom";
import {
  Box,
  LinkBox,
  LinkOverlay,
  SimpleGrid,
} from "@chakra-ui/react";
import { NftCard, Pagination } from "../../components";
import {
  CW721,
  formatPrice,
  NftInfoResponse,
  Market,
  NftInfo,
  publicIpfsUrl,
  OfferResponse,
  useSdk,
} from "../../services";
import { config } from "../../../config";

export const Gallery = () => {
  const { client } = useSdk();
  const [nfts, setNfts] = useState<NftInfo[]>([]);

  useEffect(() => {
    (async () => {
      if (!client) return;

      const contract = CW721(config.contract).use(client);
      const marketcw = Market(config.marketContract).use(client);
      const result = await contract.allTokens(undefined, 15);

      const allNfts: Promise<NftInfoResponse>[] = [];
      const allOffers: Promise<OfferResponse|undefined>[] = [];
      result.tokens.forEach(tokenId => {
        allNfts.push(contract.nftInfo(tokenId));
        allOffers.push(marketcw.offer(config.contract, tokenId));
      });

      const tokens = await Promise.all(allNfts);
      const offers = await Promise.all(allOffers);
      const items = tokens.map((nft, idx) => {
        const off = offers[idx];
        return {
          tokenId: result.tokens[idx],
          user: 'unknown',
          title: nft.name,
          price: off ? formatPrice(off.list_price): "Not listed",
          image: publicIpfsUrl(nft.image),
          total: 1
        };
      });
      setNfts(items);
    })();
  }, [client]);

  return (
    <Box m={5}>
      <SimpleGrid columns={5} spacing={10}>
        {nfts.map(nft => (
          <LinkBox as="picture" key={nft.tokenId}
            transition="transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) 0s"
            _hover={{
              transform: "scale(1.05)"
            }}>
            <LinkOverlay as={ReactRouterLink} to={`/token/${nft.tokenId}`}>
              <NftCard nft={nft} />
            </LinkOverlay>
          </LinkBox>
        ))}
      </SimpleGrid>
      <Pagination></Pagination>
    </Box>
  );
};
