import React, { forwardRef } from 'react';
import { format } from 'date-fns';

interface OrderItem {
    product_name: string;
    quantity: number;
    unit_price: number | string;
    total_price: number | string;
    mrp?: number | string | null;
    product_price?: number | string | null;
}

interface OrderData {
    order_number: string;
    created_at: string;
    retailer_name: string;
    retailer_phone?: string;
    retailer_address?: string;
    customer_name?: string;
    customer_phone?: string;
    items: OrderItem[];
    subtotal: number | string;
    discount_amount?: number | string;
    total_amount: number | string;
    payment_mode: string;
    retailer_gst_number?: string;
    retailer_receipt_footer?: string;
    retailer_show_gst?: boolean;
    order_source?: string;
    delivery_address?: string;
    payment_status?: string;
    retailer_printer_size?: string;
    ledger_previous_balance?: number | string | null;
    ledger_new_balance?: number | string | null;
}

interface ThermalReceiptProps {
    order: OrderData;
}

export const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(({ order }, ref) => {
    const is58mm = order.retailer_printer_size === '58mm';
    const paperWidthStyle = is58mm ? '48mm' : '72mm';

    // Calculate total savings: Sum of (max(MRP, product_price, unit_price) * Qty) - total_amount
    const totalOriginalValue = order.items.reduce((acc, item) => {
        const unitPrice = Number(item.unit_price) || 0;
        const mrp = item.mrp ? Number(item.mrp) : 0;
        const productPrice = item.product_price ? Number(item.product_price) : 0;
        const qty = Number(item.quantity) || 0;
        
        const originalPrice = Math.max(mrp, productPrice, unitPrice);
        return acc + (originalPrice * qty);
    }, 0);

    const calculatedSavings = totalOriginalValue - Number(order.total_amount);
    const totalSavings = calculatedSavings > 0.01 ? calculatedSavings : 0;

    const isCreditOrder = order.payment_mode && (
        order.payment_mode.toLowerCase() === 'credit' || 
        order.payment_mode.toLowerCase() === 'khata'
    );

    return (
        <div className="hidden">
            <div ref={ref} className="thermal-receipt absolute top-0 left-0 bg-white text-black bg-transparent" style={{ width: paperWidthStyle }}>
                <style type="text/css" media="print">
                    {`
                        @page { size: auto; margin: 0mm; }
                        body { margin: 0; padding: 0; background-color: transparent; }
                        .thermal-receipt { 
                            display: block !important;
                            width: ${paperWidthStyle}; 
                            max-width: 100%;
                            padding: ${is58mm ? '1mm' : '2mm'}; 
                            font-family: monospace, "Courier New"; 
                            font-size: ${is58mm ? '10px' : '11px'}; 
                            line-height: 1.3;
                            color: black;
                            word-wrap: break-word;
                        }
                        .receipt-table { width: 100%; }
                        .receipt-table th, .receipt-table td { padding: 2px 0; }
                    `}
                </style>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: is58mm ? '14px' : '16px', fontWeight: 'bold', margin: '0 0 3px 0', textTransform: 'uppercase' }}>{order.retailer_name}</h2>
                    {order.retailer_address && <div style={{ fontSize: is58mm ? '9px' : '10px' }}>{order.retailer_address}</div>}
                    {order.retailer_phone && <div style={{ fontSize: is58mm ? '9px' : '10px' }}>Ph: {order.retailer_phone}</div>}
                    {order.retailer_show_gst && order.retailer_gst_number && (
                        <div style={{ fontSize: is58mm ? '9px' : '10px', fontWeight: 'bold' }}>GST: {order.retailer_gst_number}</div>
                    )}
                </div>
                
                <div style={{ borderBottom: '1px dashed black', margin: '4px 0' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontWeight: 'bold', fontSize: is58mm ? '11px' : '12px' }}>
                    <span>ORDER: {order.order_number}</span>
                    <span style={{ fontSize: is58mm ? '9px' : '10px' }}>{format(new Date(order.created_at), 'dd/MM/yy HH:mm')}</span>
                </div>
                
                <div style={{ marginBottom: '4px', fontSize: is58mm ? '9px' : '10px' }}>
                    {order.order_source && (
                        <div style={{ fontStyle: 'italic', opacity: 0.8 }}>{order.order_source}</div>
                    )}
                </div>

                <div style={{ borderBottom: '1px solid black', margin: '4px 0' }}></div>

                {(order.customer_name || order.customer_phone) && (
                    <div style={{ marginBottom: '5px', fontSize: is58mm ? '10px' : '11px' }}>
                        <div><strong style={{ textTransform: 'uppercase' }}>{order.customer_name || 'GUEST'}</strong></div>
                        {order.customer_phone && <div>Mobile: {order.customer_phone}</div>}
                        {order.order_source === 'Online Order' && order.delivery_address && order.delivery_address !== 'Self Pickup' && (
                            <div style={{ marginTop: '3px', borderLeft: '2px solid black', paddingLeft: '5px' }}>
                                <strong>Delivery Addr:</strong><br/>
                                {order.delivery_address}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ borderBottom: '1px dashed black', margin: '5px 0' }}></div>
                
                {is58mm ? (
                    /* 58mm optimized layout (no rigid table columns to prevent clipping) */
                    <div style={{ fontSize: '10px' }}>
                        <div style={{ borderBottom: '1px solid black', paddingBottom: '2px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>ITEM DESCRIPTION</span>
                            <span>AMOUNT</span>
                        </div>
                        {order.items.map((item, idx) => {
                            const unitPrice = Number(item.unit_price) || 0;
                            const mrp = item.mrp ? Number(item.mrp) : 0;
                            const productPrice = item.product_price ? Number(item.product_price) : 0;
                            const qty = Number(item.quantity) || 0;
                            const totalPrice = Number(item.total_price) || 0;

                            const originalPrice = Math.max(mrp, productPrice, unitPrice);
                            const itemSavings = originalPrice > unitPrice ? (originalPrice - unitPrice) * qty : 0;
                            const hasSavings = itemSavings > 0.01;

                            return (
                                <div key={idx} style={{ padding: '3px 0', borderBottom: '1px dashed #eee' }}>
                                    <div style={{ fontWeight: 'bold' }}>{item.product_name}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                                        <div>
                                            {qty} x ₹{unitPrice.toFixed(2)}
                                            {hasSavings && mrp > 0 && (
                                                <span style={{ marginLeft: '4px', textDecoration: 'line-through', opacity: 0.6 }}>
                                                    ₹{mrp.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontWeight: 'bold' }}>₹{totalPrice.toFixed(2)}</div>
                                    </div>
                                    {hasSavings && (
                                        <div style={{ fontSize: '9px', fontStyle: 'italic', opacity: 0.8 }}>
                                            Saved: ₹{itemSavings.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* 80mm layout (Standard table) */
                    <table className="receipt-table" style={{ textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid black' }}>
                                <th style={{ width: '45%' }}>ITEM</th>
                                <th style={{ textAlign: 'center' }}>QTY</th>
                                <th style={{ textAlign: 'right' }}>PRICE</th>
                                <th style={{ textAlign: 'right' }}>TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, idx) => {
                                const unitPrice = Number(item.unit_price) || 0;
                                const mrp = item.mrp ? Number(item.mrp) : 0;
                                const productPrice = item.product_price ? Number(item.product_price) : 0;
                                const qty = Number(item.quantity) || 0;
                                const totalPrice = Number(item.total_price) || 0;

                                const originalPrice = Math.max(mrp, productPrice, unitPrice);
                                const itemSavings = originalPrice > unitPrice ? (originalPrice - unitPrice) * qty : 0;
                                const hasSavings = itemSavings > 0.01;

                                return (
                                    <tr key={idx} style={{ verticalAlign: 'top' }}>
                                        <td>
                                            <div>{item.product_name}</div>
                                            {hasSavings && (
                                                <div style={{ fontSize: '9px', fontStyle: 'italic', opacity: 0.8 }}>
                                                    {mrp > 0 ? `MRP: ₹${mrp.toFixed(2)} ` : ''}(Saved: ₹{itemSavings.toFixed(2)})
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{qty}</td>
                                        <td style={{ textAlign: 'right' }}>{unitPrice.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>{totalPrice.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                <div style={{ borderTop: '1px dashed black', margin: '5px 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Subtotal:</span>
                    <span>₹{Number(order.subtotal).toFixed(2)}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Discount:</span>
                        <span>-₹{Number(order.discount_amount).toFixed(2)}</span>
                    </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: is58mm ? '12px' : '14px', margin: '4px 0', borderTop: '1px solid black', paddingTop: '4px' }}>
                    <span>TOTAL:</span>
                    <span>₹{Number(order.total_amount).toFixed(2)}</span>
                </div>

                {/* Savings Highlight near total */}
                {totalSavings > 0 && (
                    <div style={{ 
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        fontSize: is58mm ? '10px' : '11px', 
                        margin: '6px 0', 
                        border: '1px dashed black', 
                        padding: '4px' 
                    }}>
                        🎉 YOU SAVED ₹{totalSavings.toFixed(2)} ON THIS BILL
                    </div>
                )}

                {/* Khata / Credit Account Summary (only for credit orders with balances) */}
                {isCreditOrder && order.ledger_new_balance !== undefined && order.ledger_new_balance !== null && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid black', paddingTop: '6px', fontSize: is58mm ? '9px' : '10px' }}>
                        <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>
                            CREDIT / KHATA ACCOUNT SUMMARY
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>Prev. Balance:</span>
                            <span>₹{Number(order.ledger_previous_balance || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>Current Bill:</span>
                            <span>₹{Number(order.total_amount).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dashed black', paddingTop: '2px', marginTop: '2px' }}>
                            <span>Net Outstanding:</span>
                            <span>₹{Number(order.ledger_new_balance).toFixed(2)}</span>
                        </div>
                    </div>
                )}
                
                <div style={{ borderTop: '1px dashed black', margin: '5px 0' }}></div>

                <div style={{ textAlign: 'center', fontSize: is58mm ? '9px' : '10px', marginTop: '4px' }}>
                    <div style={{ fontWeight: 'bold' }}>
                        PAYMENT: {String(order.payment_mode).toUpperCase()} 
                        {order.payment_status ? ` (${order.payment_status})` : ''}
                    </div>

                    {order.order_source === 'Store Order' && (
                        <div style={{ 
                            marginTop: '10px', 
                            padding: '5px', 
                            border: '1px solid black', 
                            borderRadius: '2px',
                            fontWeight: 'bold'
                        }}>
                            Order Online Anytime – Get "Order Easy" on Play Store
                        </div>
                    )}

                    <div style={{ marginTop: '8px', fontWeight: 'bold', fontSize: is58mm ? '10px' : '11px', borderTop: '1px solid black', paddingTop: '5px' }}>
                        {order.retailer_receipt_footer || 'THANK YOU FOR VISITING!'}
                    </div>
                </div>
            </div>
        </div>
    );
});

ThermalReceipt.displayName = 'ThermalReceipt';
