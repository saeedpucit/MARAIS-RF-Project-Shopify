import '@shopify/ui-extensions/preact';
import {render} from 'preact';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
    const order = shopify.order.value;
    const lines = shopify.lines.value;

  return (
    <s-banner>
      <s-stack direction="block" gap="base">
        <s-text>Need to return something?</s-text>

        <s-button commandFor="return-modal">
          Return items
        </s-button>

        <s-modal id="return-modal" heading="Select items to return">
          <s-stack direction="block" gap="base">
            {lines?.map((line) => (
              <s-checkbox key={line.id} value={line.id}>
                {line.title}
              </s-checkbox>
            ))}

            <s-button
              variant="primary"
              onClick={() => {
                fetch('https://your-app.com/api/returns', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({
                    orderId: order.id,
                    // selected line item IDs here
                  }),
                });
              }}
            >
              Submit return
            </s-button>
          </s-stack>
        </s-modal>
      </s-stack>
    </s-banner>
  );
}