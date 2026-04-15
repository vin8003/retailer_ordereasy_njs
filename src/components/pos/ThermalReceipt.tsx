import React, { forwardRef } from 'react';
import { format } from 'date-fns';

interface OrderItem {
    product_name: string;
    quantity: number;
    unit_price: number | string;
    total_price: number | string;
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
    // New fields for Online Orders
    order_source?: string; // e.g. "Online Order" or "Store Order"
    delivery_address?: string;
    payment_status?: string; // e.g. "PAID (Online)" or "UNPAID (COD)"
}

interface ThermalReceiptProps {
    order: OrderData;
}

export const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(({ order }, ref) => {
    return (
        <div className="hidden">
            <div ref={ref} className="thermal-receipt absolute top-0 left-0 bg-white text-black bg-transparent">
                <style type="text/css" media="print">
                    {`
                        @page { size: auto; margin: 0mm; }
                        body { margin: 0; padding: 0; background-color: transparent; }
                        .thermal-receipt { 
                            display: block !important;
                            width: 72mm; /* Slightly narrower to prevent overflow on some 80mm rollers */
                            max-width: 100%;
                            padding: 2mm; 
                            font-family: monospace, "Courier New"; 
                            font-size: 11px; /* Slightly smaller for better fit */
                            line-height: 1.3;
                            color: black;
                            word-wrap: break-word;
                        }
                        .receipt-table { width: 100%; }
                        .receipt-table th, .receipt-table td { padding: 2px 0; }
                    `}
                </style>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 3px 0', textTransform: 'uppercase' }}>{order.retailer_name}</h2>
                    {order.retailer_address && <div style={{ fontSize: '10px' }}>{order.retailer_address}</div>}
                    {order.retailer_phone && <div style={{ fontSize: '10px' }}>Ph: {order.retailer_phone}</div>}
                    {order.retailer_show_gst && order.retailer_gst_number && (
                        <div style={{ fontSize: '10px', fontWeight: 'bold' }}>GST: {order.retailer_gst_number}</div>
                    )}
                </div>
                
                <div style={{ borderBottom: '1px dashed black', margin: '4px 0' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontWeight: 'bold', fontSize: '12px' }}>
                    <span>ORDER: {order.order_number}</span>
                    <span style={{ fontSize: '10px' }}>{format(new Date(order.created_at), 'dd/MM/yy HH:mm')}</span>
                </div>
                
                <div style={{ marginBottom: '4px', fontSize: '10px' }}>
                    {order.order_source && (
                        <div style={{ fontStyle: 'italic', opacity: 0.8 }}>{order.order_source}</div>
                    )}
                </div>

                <div style={{ borderBottom: '1px solid black', margin: '4px 0' }}></div>

                {(order.customer_name || order.customer_phone) && (
                    <div style={{ marginBottom: '5px' }}>
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
                        {order.items.map((item, idx) => (
                            <tr key={idx} style={{ verticalAlign: 'top' }}>
                                <td>{item.product_name}</td>
                                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right' }}>{Number(item.unit_price).toFixed(2)}</td>
                                <td style={{ textAlign: 'right' }}>{Number(item.total_price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', margin: '4px 0', borderTop: '1px solid black', paddingTop: '4px' }}>
                    <span>TOTAL:</span>
                    <span>₹{Number(order.total_amount).toFixed(2)}</span>
                </div>
                
                <div style={{ borderTop: '1px dashed black', margin: '5px 0' }}></div>

                <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '4px' }}>
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
                            fontSize: '10px',
                            fontWeight: 'bold'
                        }}>
                            Order Online Anytime – Get "Order Easy" on Play Store
                        </div>
                    )}

                    <div style={{ marginTop: '8px', fontWeight: 'bold', fontSize: '11px', borderTop: '1px solid black', paddingTop: '5px' }}>
                        {order.retailer_receipt_footer || 'THANK YOU FOR VISITING!'}
                    </div>
                </div>
            </div>
        </div>
    );
});

ThermalReceipt.displayName = 'ThermalReceipt';
