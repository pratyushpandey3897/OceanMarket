import { useUserPreferences } from '@context/UserPreferences'
import React, { ReactElement, useEffect, useState } from 'react'
import Table, { TableOceanColumn } from '@shared/atoms/Table'
import { LoggerInstance } from '@oceanprotocol/lib'
import Price from '@shared/Price'
import Tooltip from '@shared/atoms/Tooltip'
import AssetTitle from '@shared/AssetListTitle'
import { retrieveDDOListByDIDs } from '@utils/aquarius'
import { useCancelToken } from '@hooks/useCancelToken'
import { getAccessDetailsForAssets } from '@utils/accessDetailsAndPricing'
import { useWeb3 } from '@context/Web3'
import { useMarketMetadata } from '@context/MarketMetadata'

const columns: TableOceanColumn<AssetExtended>[] = [
  {
    name: 'Dataset',
    selector: (row) => {
      const { metadata } = row
      return <AssetTitle title={metadata.name} asset={row} />
    },
    maxWidth: '45rem',
    grow: 1
  },
  {
    name: 'Datatoken Symbol',
    selector: (row) => (
      <Tooltip content={row.datatokens[0].name}>
        <>{row.datatokens[0].symbol}</>
      </Tooltip>
    ),
    maxWidth: '10rem'
  },
  {
    name: 'Price',
    selector: (row) => <Price accessDetails={row.accessDetails} size="small" />,
    right: true
  }
]

export default function Bookmarks(): ReactElement {
  const { appConfig } = useMarketMetadata()
  const { accountId } = useWeb3()
  const { bookmarks } = useUserPreferences()

  const [pinned, setPinned] = useState<AssetExtended[]>()
  const [isLoading, setIsLoading] = useState<boolean>()
  const { chainIds } = useUserPreferences()
  const newCancelToken = useCancelToken()

  useEffect(() => {
    if (!appConfig?.metadataCacheUri || bookmarks?.length === 0) return

    async function init() {
      if (!bookmarks?.length) {
        setPinned([])
        return
      }

      setIsLoading(true)

      try {
        const result = await retrieveDDOListByDIDs(
          bookmarks,
          chainIds,
          newCancelToken()
        )
        if (!result?.length) return

        const pinnedAssets: AssetExtended[] = await getAccessDetailsForAssets(
          result,
          accountId
        )
        setPinned(pinnedAssets)
      } catch (error) {
        LoggerInstance.error(`Bookmarks error:`, error.message)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [
    appConfig?.metadataCacheUri,
    bookmarks,
    chainIds,
    accountId,
    newCancelToken
  ])

  return (
    <Table
      columns={columns}
      data={pinned}
      isLoading={isLoading}
      emptyMessage={
        chainIds.length === 0
          ? 'No network selected'
          : 'Your bookmarks will appear here.'
      }
      noTableHead
    />
  )
}
