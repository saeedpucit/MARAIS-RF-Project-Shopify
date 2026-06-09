import { useAppBridge } from '@shopify/app-bridge-react';
import { useEffect, useState } from 'react';
import httpClient from '../libs/api';
import ImagesViewer from '../components/ImagesViewer';
import { confirmAlert } from 'react-confirm-alert';

export default function PendingReturns () {
  const shopify = useAppBridge();
  const [pendingReturns, setPendingReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

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
      const { rows = [], totalCount, pageInfo: newPageInfo } = await httpClient.get('/product-returns/pending', {
        params: { page }
      });
      setPendingReturns(rows);
      if (newPageInfo) {
        setPageInfo(newPageInfo);
      }
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

  const handleDelete = async (productId, id) => {
    const pid = productId.split('/').at(-1);
    try {
      setProcessingId(id);
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
          <a key={idx} href={img} target="_blank" rel="noreferrer">
            <s-thumbnail src={img} alt={`Return image ${idx + 1}`} size="small"/>
          </a>
        ))}
        {images.length > 3 && (
          <s-badge tone="neutral">+{images.length - 3}</s-badge>
        )}
      </s-stack>
    );
  };

  const storeUrl = `https://admin.shopify.com/store/${import.meta.env.VITE_STORE_NAME}`;

  const creditTypes = {
    STORE_CREDIT: 'Store Credit',
    PARTIAL_REFUND: 'Partial Refund',
    SIZE_COLOR_EXCHANGE: 'Size/Color Exchange',
  };

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
                  <s-table-header>Actions</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {pendingReturns.map((ret) => (
                    <s-table-row key={ret.id}>
                      <s-table-cell>
                        <s-link
                          href={storeUrl + '/orders/' + ret.orderId.replace(/[^\d]+/g, '')}>{ret.orderNumber}</s-link>
                      </s-table-cell>
                      <s-table-cell>
                        <div style={{ textAlign: 'right' }}>
                          <s-link
                            href={storeUrl + '/customers/' + ret.customerId.replace(/[^\d]+/g, '')}>{ret.customerName}</s-link>
                        </div>
                      </s-table-cell>
                      <s-table-cell>
                        <div style={{ textAlign: 'right' }}>
                          <s-link
                            href={storeUrl + '/products/' + ret.productId.replace(/[^\d]+/g, '')}>{ret.productTitle}</s-link>
                        </div>
                      </s-table-cell>
                      <s-table-cell>
                        <s-stack direction="block" gap="none">
                          <div style={{ textAlign: 'right' }}>
                            <s-text>{ret.returnTypeCaption}</s-text>
                          </div>
                        </s-stack>
                      </s-table-cell>
                      <s-table-cell>
                        <s-stack direction="block" gap="none">
                          <s-text>{creditTypes[ret.creditType]}</s-text>
                        </s-stack>
                      </s-table-cell>
                      <s-table-cell>
                        <s-text tone="neutral">${ret.amount?.toFixed(2)}</s-text>
                      </s-table-cell>
                      <s-table-cell>
                        <s-text tone="neutral">${ret.fee?.toFixed(2)}</s-text>
                      </s-table-cell>
                      <s-table-cell>
                        <s-text tone="neutral">${ret.returnAmount?.toFixed(2)}</s-text>
                      </s-table-cell>
                      <s-table-cell>
                        <ImagesViewer images={ret.images}/>
                      </s-table-cell>
                      <s-table-cell>
                        {renderStatusBadge(ret.isApproved)}
                      </s-table-cell>
                      <s-table-cell>
                        <div style={{marginTop: 5}}>
                          <s-button
                            variant="primary"
                            tone="auto"
                            onClick={() => confirmAlert({
                              title: 'Confirm approve',
                              message: 'Are you sure to approve this request?',
                              buttons: [
                                {
                                  label: 'Yes',
                                  onClick: () => handleApprove(ret.id)
                                },
                                {
                                  label: 'No',
                                  onClick: () => {}
                                }
                              ]
                            })}
                            disabled={processingId !== null}
                            loading={processingId === ret.id}
                          >
                            Approve
                          </s-button>
                          <span style={{ display: 'inline-block', width: 5, height: 3 }}></span>
                          <s-button
                            variant="secondary"
                            tone="critical"
                            onClick={() => confirmAlert({
                              title: 'Confirm reject',
                              message: 'Are you sure to reject this request?',
                              buttons: [
                                {
                                  label: 'Yes',
                                  onClick: () => handleReject(ret.id)
                                },
                                {
                                  label: 'No',
                                  onClick: () => {}
                                }
                              ]
                            })}
                            disabled={processingId !== null}
                            loading={processingId === ret.id}
                          >
                            Reject
                          </s-button>
                          <span style={{ display: 'inline-block', width: 5, height: 3 }}></span>
                          <s-button
                            variant="primary"
                            tone="critical"
                            onClick={() => confirmAlert({
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
                            disabled={processingId !== null}
                            loading={processingId === ret.id}
                          >
                            Delete
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
