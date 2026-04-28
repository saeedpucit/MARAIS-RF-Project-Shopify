import { useEffect, useState } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticate } from '../shopify.server';
import httpClient from '../libs/api';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  return null;
};

export default function Index () {
  const shopify = useAppBridge();
  const [pendingReturns, setPendingReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchPendingReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const { rows = [], totalCount } = await httpClient.get('/product-returns/pending');
      setPendingReturns(rows);
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

  useEffect(() => {
    fetchPendingReturns();
  }, []);

  const handleApprove = async (returnId) => {
    try {
      setProcessingId(returnId);
      await httpClient.post(`/product-returns/${returnId}/approve-reject`, {
        status: 'approved',
      });

      // Remove from list and show success
      setPendingReturns(prev => prev.filter(r => r.id !== returnId));

      if (shopify) {
        shopify.toast.show('Return approved successfully', 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve return';
      setError(errorMessage);
      if (shopify) {
        shopify.toast.show('Failed to approve return', 'critical');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (returnId) => {
    try {
      setProcessingId(returnId);
      await httpClient.post(`/product-returns/${returnId}/approve-reject`, {
        status: 'rejected',
      });

      // Remove from list and show success
      setPendingReturns(prev => prev.filter(r => r.id !== returnId));

      if (shopify) {
        shopify.toast.show('Return rejected successfully', 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject return';
      setError(errorMessage);
      if (shopify) {
        shopify.toast.show('Failed to reject return', 'critical');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const renderStatusBadge = (isApproved) => {
    if (isApproved === null || isApproved === undefined) {
      return <s-badge tone="warning">Pending</s-badge>;
    }
    return isApproved ? (
      <s-badge tone="success">Approved</s-badge>
    ) : (
      <s-badge tone="critical">Pending</s-badge>
    );
  };

  const renderImageThumbnails = (images) => {
    if (!images || images.length === 0) {
      return <s-text tone="neutral">No images</s-text>;
    }

    return (
      <s-stack direction="inline" gap="none" align-items="center">
        {images.slice(0, 3).map((img, idx) => (
          <a href={img} target="_blank"><s-thumbnail key={idx} src={img} alt={`Return image ${idx + 1}`} size="small"/></a>
        ))}
        {images.length > 3 && (
          <s-badge tone="neutral">+{images.length - 3}</s-badge>
        )}
      </s-stack>
    );
  };

  const storeUrl = `https://admin.shopify.com/store/${import.meta.env.VITE_STORE_NAME}`;

  return (
    <s-page heading="Product Return Management">
      <s-section>
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="loose" align-items="center" justify-content="space-between">
            <s-stack direction="block" gap="none">
              <s-heading>Pending Returns</s-heading>
            </s-stack>
          </s-stack>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <s-text tone="subdued">Manage and process product return requests</s-text>
            </div>
            <div>
              <s-button onClick={fetchPendingReturns} size="slim" loading={loading} variant="primary">
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
                <s-table-header>Order</s-table-header>
                <s-table-header>Product</s-table-header>
                <s-table-header>Media</s-table-header>
                <s-table-header>Details</s-table-header>
                <s-table-header>Status</s-table-header>
                <s-table-header>Amount</s-table-header>
                <s-table-header>Actions</s-table-header>
              </s-table-header-row>
              <s-table-body>
                {pendingReturns.map((ret) => (
                  <s-table-row key={ret.id}>
                    <s-table-cell>{ret.id}</s-table-cell>
                    <s-table-cell>
                      <s-link href={storeUrl + '/customers/' + ret.customerId.replace(/[^\d]+/g, '')}>Customer</s-link>
                    </s-table-cell>
                    <s-table-cell>
                      <s-link href={storeUrl + '/orders/' + ret.orderId.replace(/[^\d]+/g, '')}>Order #{ret.orderId?.split('/').pop()}</s-link>
                    </s-table-cell>
                    <s-table-cell>
                      <s-link href={storeUrl + '/products/' + ret.productId.replace(/[^\d]+/g, '')}>Product</s-link>
                    </s-table-cell>
                    <s-table-cell>
                      {renderImageThumbnails(ret.images)}
                    </s-table-cell>
                    <s-table-cell>
                      <s-stack direction="block" gap="none">
                        <s-text tone="neutral">Type:</s-text>
                        <s-text>{ret.returnTypeCaption}</s-text>
                        <s-text tone="neutral">Size:</s-text>
                        <s-text>{ret.size}</s-text>
                        <s-text tone="neutral">Color:</s-text>
                        <s-chip>{ret.color}</s-chip>
                      </s-stack>
                    </s-table-cell>
                    <s-table-cell>
                      {renderStatusBadge(ret.isApproved)}
                    </s-table-cell>
                    <s-table-cell>
                      <s-stack direction="block" gap="none">
                        <s-text tone="neutral">Original:</s-text>
                        <s-text>${ret.amount?.toFixed(2)}</s-text>
                        <s-text tone="neutral">Fee:</s-text>
                        <s-text>${ret.fee?.toFixed(2)}</s-text>
                        <s-text tone="neutral">Return:</s-text>
                        <s-text tone="success" type="strong">${ret.returnAmount?.toFixed(2)}</s-text>
                      </s-stack>
                    </s-table-cell>
                    <s-table-cell>
                        <div>
                          <s-button
                            variant="primary"
                            tone="auto"
                            onClick={() => handleApprove(ret.id)}
                            disabled={processingId !== null}
                            loading={processingId === ret.id}
                          >
                            Approve
                          </s-button>
                          <span style={{display: 'inline-block', width: 5}}></span>
                          <s-button
                            variant="secondary"
                            tone="critical"
                            onClick={() => handleReject(ret.id)}
                            disabled={processingId !== null}
                            loading={processingId === ret.id}
                          >
                            Reject
                          </s-button>
                        </div>
                    </s-table-cell>
                  </s-table-row>
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
        </s-stack>
      </s-section>
    </s-page>
  );
}
