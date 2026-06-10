import { useEffect, useState } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticate } from '../shopify.server';
import httpClient from '../libs/api';
import * as PropTypes from 'prop-types';
import ImagesViewer from '../components/ImagesViewer';
import { confirmAlert } from 'react-confirm-alert';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  return null;
};

const creditTypes = {
  STORE_CREDIT: 'Store Credit',
  PARTIAL_REFUND: 'Partial Refund',
  SIZE_COLOR_EXCHANGE: 'Size/Color Exchange',
};

const TableRow = props => {
  return (
    <s-table-row>
      <s-table-cell>
        <div className="max-sm:text-right">
        <s-link
          href={props.storeUrl + '/orders/' + props.ret.orderId.replace(/[^\d]+/g, '')}>{props.ret.orderNumber}</s-link>
        </div>
      </s-table-cell>
      <s-table-cell>
        <div className="max-sm:text-right">
          <s-link
            href={props.storeUrl + '/customers/' + props.ret.customerId.replace(/[^\d]+/g, '')}>{props.ret.customerName}</s-link>
        </div>
      </s-table-cell>
      <s-table-cell>
        <div className="max-sm:text-right">
          <s-link
            href={props.storeUrl + '/products/' + props.ret.productId.replace(/[^\d]+/g, '')}>{props.ret.productTitle}</s-link>
        </div>
      </s-table-cell>
      <s-table-cell>
        <div className="max-sm:text-right">{props.ret.returnTypeCaption}</div>
      </s-table-cell>
      <s-table-cell>
        <div className="max-sm:text-right">{creditTypes?.[props.ret.creditType] ?? '-'}</div>
      </s-table-cell>
      <s-table-cell>
        <s-text tone="neutral">${props.ret.amount?.toFixed(2)}</s-text>
      </s-table-cell>
      <s-table-cell>
        <s-text tone="neutral">${props.ret.fee?.toFixed(2)}</s-text>
      </s-table-cell>
      <s-table-cell>
        <s-text tone="neutral">${props.ret.returnAmount?.toFixed(2)}</s-text>
      </s-table-cell>
      <s-table-cell>
        <ImagesViewer images={props.ret.images}/>
      </s-table-cell>
      <s-table-cell>
        {props.ret.rejectedAt && (<s-badge tone="critical">Rejected</s-badge>)}
        {props.ret.approvedAt && (<s-badge tone="success">Approved</s-badge>)}
        {(!props.ret.approvedAt && !props.ret.rejectedAt) && (<s-badge tone="neutral">Pending</s-badge>)}
      </s-table-cell>
      <s-table-cell>
        <div className="max-sm:mt-2">
          <s-button
            variant="primary"
            tone="critical"
            onClick={() => props.handleDelete()}
          >
            Delete
          </s-button>
        </div>
      </s-table-cell>
    </s-table-row>
  );
};

TableRow.propTypes = {
  ret: PropTypes.any,
  storeUrl: PropTypes.string,
  renderImageThumbnails: PropTypes.any
};
export default function Index () {
  const shopify = useAppBridge();
  const [pendingReturns, setPendingReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [pageInfo, setPageInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchPendingReturns = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const { rows = [], totalCount, pageInfo: newPageInfo } = await httpClient.get('/product-returns', {
        params: { page }
      });
      setPendingReturns(rows);
      setPageInfo(newPageInfo);
      return totalCount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch returns';
      setError(errorMessage);
      setPendingReturns([]);
      if (shopify) {
        shopify.toast.show('Failed to load returns', 'critical');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId, id) => {
    const pid = productId.split('/').at(-1);
    try {
      await httpClient.delete(`/product-returns/product-id/${pid}`);

      // Remove from list and show success
      setPendingReturns(prev => prev.filter(r => r.id !== id));

      if (shopify) {
        shopify.toast.show('Return deleted successfully', 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete return';
      setError(errorMessage);
      if (shopify) {
        shopify.toast.show('Failed to delete return', 'critical');
      }
    } finally {
    }
  };

  useEffect(() => {
    fetchPendingReturns();
  }, []);

  const storeUrl = `https://admin.shopify.com/store/${import.meta.env.VITE_STORE_NAME}`;

  return (
    <s-page heading="Product Return Management">
      <div>
        <s-section>
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="loose" align-items="center" justify-content="space-between">
              <s-stack direction="block" gap="none">
                <s-heading>Product Returns</s-heading>
              </s-stack>
            </s-stack>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <s-text tone="subdued">Manage and process product return requests</s-text>
              </div>
              <div>
                <s-button onClick={() => fetchPendingReturns(pageInfo.currentPage)} size="slim" loading={loading}
                          variant="primary">
                  Refresh
                </s-button>
              </div>
            </div>

            {error && (
              <s-banner heading="Error" tone="critical" dismissible onDismiss={() => setError(null)}>
                {error}
              </s-banner>
            )}

            {loading && pendingReturns.length === 0 ? (
              <s-box padding="base" text-align="center">
                <s-spinner accessibilityLabel="Loading returns"/>
              </s-box>
            ) : pendingReturns.length === 0 ? (
              <s-box padding="base" text-align="center">
                <s-icon type="inbox-icon" tone="neutral"/>
                <s-heading>No pending returns</s-heading>
                <s-text tone="neutral">All return requests have been processed.</s-text>
              </s-box>
            ) : (
              <s-table variant="auto">
                <s-table-header-row>
                  <s-table-header list-slot="primary">#</s-table-header>
                  <s-table-header>Customer</s-table-header>
                  <s-table-header>Product</s-table-header>
                  <s-table-header>Reason for Return</s-table-header>
                  <s-table-header>Type of Return</s-table-header>
                  <s-table-header>Original Amount</s-table-header>
                  <s-table-header>Return Fee</s-table-header>
                  <s-table-header>Refund Amount</s-table-header>
                  <s-table-header>Media</s-table-header>
                  <s-table-header>Status</s-table-header>
                  <s-table-header>&nbsp;</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {pendingReturns.map((ret) => (
                    <TableRow
                      handleDelete={() => confirmAlert({
                        title: 'Confirm delete',
                        message: 'Are you sure to delete this request?',
                        buttons: [
                          {
                            label: 'Yes',
                            onClick: () => handleDelete(ret.productId, ret.id)
                          },
                          {
                            label: 'No',
                            onClick: () => {}
                          }
                        ]
                      })}
                      key={ret.id}
                      ret={ret} storeUrl={storeUrl}/>
                  ))}
                </s-table-body>
              </s-table>
            )}

            {pendingReturns.length > 0 && (
              <s-box padding="base" border="base" border-radius="base">
                <s-stack direction="block" gap="base">
                  <s-stack direction="inline" gap="base" align-items="center">
                    <s-text tone="neutral">Total Returns:</s-text>
                    <s-text type="strong">{pendingReturns.length}</s-text>
                  </s-stack>
                  <s-stack direction="inline" gap="base" align-items="center">
                    <s-text tone="neutral">Awaiting Action:</s-text>
                    <s-text tone="warning" type="strong">
                      {pendingReturns.filter(r => r.isApproved === false).length}
                    </s-text>
                  </s-stack>
                  <s-stack direction="inline" gap="base" align-items="center">
                    <s-text tone="neutral">Total Refund:</s-text>
                    <s-text type="strong">
                      ${pendingReturns.reduce((sum, r) => sum + (r.returnAmount || 0), 0).toFixed(2)}
                    </s-text>
                  </s-stack>
                </s-stack>
              </s-box>
            )}

            {/* Pagination Component */}
            {Number(pageInfo.totalPages) > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <s-stack direction="inline" gap="base" align-items="center" justify-content="center">
                  <s-button
                    onClick={() => {
                      if (pageInfo.hasPreviousPage) {
                        fetchPendingReturns(pageInfo.currentPage - 1);
                      }
                    }}
                    disabled={!pageInfo.hasPreviousPage}
                  >
                    Previous
                  </s-button>
                  <s-text tone="subdued">
                    Page {pageInfo.currentPage} of {pageInfo.totalPages}
                  </s-text>
                  <s-button
                    onClick={() => {
                      if (pageInfo.hasNextPage) {
                        fetchPendingReturns(pageInfo.currentPage + 1);
                      }
                    }}
                    disabled={!pageInfo.hasNextPage}
                  >
                    Next
                  </s-button>
                </s-stack>
              </div>
            )}
          </s-stack>
        </s-section>
      </div>
    </s-page>
  );
}
