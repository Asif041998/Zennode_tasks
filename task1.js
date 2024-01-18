const readline = require('readline');

class ShoppingCart {
    constructor() {
        this.products = {
            "Product A": { price: 20, quantity: 0, giftWrap: false },
            "Product B": { price: 40, quantity: 0, giftWrap: false },
            "Product C": { price: 50, quantity: 0, giftWrap: false },
        };
        this.discountRules = {
            flat_10_discount: { condition: total => total > 200, discount: 10 },
            bulk_5_discount: { condition: qty => Object.values(this.products).some(product => product.quantity > 10), discount: 5 },
            bulk_10_discount: { condition: totalQty => totalQty > 20, discount: 10 },
            tiered_50_discount: { condition: totalQty => totalQty > 30 && Object.values(this.products).some(product => product.quantity > 15), discount: 50 },
        };
        this.shippingFee = 5;
        this.giftWrapFee = 1;
    }

    static async prompt(question) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer);
            });
        });
    }

    calculateDiscount() {
        const totalQty = Object.values(this.products).reduce((total, product) => total + product.quantity, 0);
        const totalPrice = Object.values(this.products).reduce((total, product) => total + product.price * product.quantity, 0);
        const applicableDiscounts = {};

        for (const rule in this.discountRules) {
            if (this.discountRules[rule].condition(totalQty)) {
                applicableDiscounts[rule] = this.discountRules[rule].discount;
            }
        }

        if (Object.keys(applicableDiscounts).length > 0) {
            const bestDiscountRule = Object.keys(applicableDiscounts).reduce((a, b) => applicableDiscounts[a] > applicableDiscounts[b] ? a : b);
            return [bestDiscountRule, applicableDiscounts[bestDiscountRule]];
        } else {
            return [null, 0];
        }
    }

    calculateTotals() {
        const [subtotal, discountRule, discountPercentage] = this.calculateTotalsHelper();
        const discountAmount = subtotal * (discountPercentage / 100);
        const shippingFee = Math.floor(subtotal / 10) * this.shippingFee;
        const giftWrapFee = Object.values(this.products).reduce((total, product) => total + (product.giftWrap ? product.quantity * this.giftWrapFee : 0), 0);
        const total = subtotal - discountAmount + shippingFee + giftWrapFee;

        return { subtotal, discountRule, discountAmount, shippingFee, giftWrapFee, total };
    }

    calculateTotalsHelper() {
        const subtotal = Object.values(this.products).reduce((total, product) => total + product.price * product.quantity, 0);
        const [discountRule, discountPercentage] = this.calculateDiscount();

        return [subtotal, discountRule, discountPercentage];
    }

    displayReceipt() {
        for (const [product, productInfo] of Object.entries(this.products)) {
            console.log(`${product}: Quantity: ${productInfo.quantity}, Total: $${productInfo.quantity * productInfo.price}`);
        }

        const { subtotal, discountRule, discountAmount, shippingFee, giftWrapFee, total } = this.calculateTotals();

        console.log(`\nSubtotal: $${subtotal}`);
        if (discountRule) {
            console.log(`Discount Applied (${discountRule}): -$${discountAmount.toFixed(2)}`);
        }
        console.log(`Shipping Fee: $${shippingFee}`);
        console.log(`Gift Wrap Fee: $${giftWrapFee.toFixed(2)}\nTotal: $${total.toFixed(2)}`);
    }
}

async function main() {
    const cart = new ShoppingCart();

    for (const [product, productInfo] of Object.entries(cart.products)) {
        const quantity = await ShoppingCart.prompt(`Enter quantity for ${product}: `);
        const giftWrap = (await ShoppingCart.prompt(`Is ${product} wrapped as a gift? (yes/no): `)).toLowerCase() === 'yes';

        productInfo.quantity = parseInt(quantity);
        productInfo.giftWrap = giftWrap;
    }

    console.log("\nReceipt:");
    cart.displayReceipt();
}

main();
