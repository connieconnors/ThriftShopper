'use client';

import React from 'react';
import { Product } from './ProductCard';
import { TSLogo } from './TSLogo';

interface SellerViewProps {
  products: Product[];
  onBack: () => void;
  onAddListing: () => void;
}

export function SellerView({ products, onBack, onAddListing }: SellerViewProps) {
  const sellerProducts = products.filter(p => p.seller === 'Thrifter Connie');
  const activeListings = sellerProducts.length;
  const soldItems = 3;
  const totalEarnings = 250.00;
  const followers = 7;

  const recentSales = [
    { item: 'Blue Denim Shirt', amount: 25.00, date: 'March 1, 2024' },
    { item: 'Wooden Coffee Table', amount: 200.00, date: 'February 25, 2024' },
  ];

  return (
    <div 
      className="absolute inset-0 z-30 overflow-y-auto"
      style={{
        backgroundColor: '#f8f9fa',
      }}
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-10 px-6 py-4 shadow-sm"
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TSLogo size={32} primaryColor="#000080" accentColor="#efbf04" />
            <span style={{ color: '#1f2937', fontSize: '18px' }}>ThriftShopper</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <button 
              onClick={onBack}
              className="transition-colors hover:opacity-70 flex items-center gap-1"
              style={{ color: '#4b5563' }}
            >
              <TSLogo size={20} primaryColor="#191970" accentColor="#efbf04" />
              <span>Home</span>
            </button>
            <button 
              className="transition-colors hover:opacity-70"
              style={{ color: '#4b5563' }}
            >
              Messages
            </button>
            <button 
              onClick={onBack}
              className="transition-colors hover:opacity-70"
              style={{ color: '#4b5563' }}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="mb-6" style={{ color: '#1f2937', fontSize: '28px' }}>
          Seller Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '32px', color: '#1f2937', marginBottom: '4px' }}>
              {activeListings}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Active Listings
            </div>
          </div>

          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '32px', color: '#1f2937', marginBottom: '4px' }}>
              {soldItems}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Sold Items
            </div>
          </div>

          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '32px', color: '#1f2937', marginBottom: '4px' }}>
              ${totalEarnings.toFixed(2)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Total Earnings
            </div>
          </div>

          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '32px', color: '#1f2937', marginBottom: '4px' }}>
              {followers}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Followers
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: '#1f2937', fontSize: '20px' }}>
              Your Listings
            </h2>
            <button
              onClick={onAddListing}
              className="px-4 py-2 rounded-lg transition-all hover:opacity-90"
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '14px',
              }}
            >
              Add New Listing
            </button>
          </div>

          <div 
            className="rounded-lg overflow-hidden"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
            }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th className="px-4 py-3 text-left" style={{ color: '#1f2937', fontSize: '13px', fontWeight: '600' }}>
                    Title
                  </th>
                  <th className="px-4 py-3 text-left" style={{ color: '#1f2937', fontSize: '13px', fontWeight: '600' }}>
                    Price
                  </th>
                  <th className="px-4 py-3 text-left" style={{ color: '#1f2937', fontSize: '13px', fontWeight: '600' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sellerProducts.map((product, index) => (
                  <tr 
                    key={product.id}
                    style={{ 
                      borderBottom: index < sellerProducts.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    <td className="px-4 py-3" style={{ color: '#1f2937', fontSize: '14px' }}>
                      {product.title}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#1f2937', fontSize: '14px' }}>
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: '#10b981', fontSize: '14px' }}>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

