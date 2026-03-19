'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Package, Star, User, Send } from 'lucide-react';
import { GlintIcon } from './GlintIcon';
import { Product } from './ProductCard';
import { useAuth } from '../app/context/AuthContext';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onBuyNow?: (id: string) => void;
  currentImageIndex: number;
  isFavorited?: boolean;
  onFavorite?: (id: string) => void;
}

export function ProductDetail({ 
  product, 
  onClose, 
  onBuyNow, 
  currentImageIndex, 
  isFavorited, 
  onFavorite 
}: ProductDetailProps) {
  const { user } = useAuth();
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow(product.id);
    } else {
      alert('Purchase initiated! In a real app, this would proceed to checkout.');
    }
  };

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(product.id);
    }
  };

  const handleContactSeller = () => {
    if (!user) {
      alert('Please sign in to contact sellers');
      return;
    }
    setShowMessageModal(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: product.id,
          buyerUserId: user.id,
          messageBody: message,
        }),
      });

      if (response.ok) {
        alert('Message sent! The seller will reply to your email.');
        setShowMessageModal(false);
        setMessage('');
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-0 z-50 bg-white overflow-y-auto"
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-4"
          style={{
            backgroundColor: '#191970',
            borderBottom: '2px solid #cfb53b',
          }}
        >
          <h3 className="text-white">Product Details</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Main Image */}
        <div className="w-full aspect-square bg-gray-100">
          <img
            src={product.images[currentImageIndex]}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Image Indicators */}
        {product.images.length > 1 && (
          <div className="flex justify-center gap-2 py-3">
            {product.images.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: index === currentImageIndex ? '#cfb53b' : '#e0e0e0',
                }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Title and Price */}
          <div className="mb-4">
            <h2 className="mb-2">{product.title || 'Untitled'}</h2>
            <p style={{ color: '#cfb53b' }}>${(product.price ?? 0).toFixed(2)}</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {product.tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: 'rgba(25, 25, 112, 0.1)',
                  color: '#191970',
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h4 className="mb-2">Description</h4>
            <p className="opacity-75">{product.description}</p>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(25, 25, 112, 0.1)' }}
            >
              <MapPin className="w-5 h-5" style={{ color: '#191970' }} />
            </div>
            <div>
              <p className="text-sm opacity-75">Location</p>
              <p>{product.location}</p>
            </div>
          </div>

          {/* Seller */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
            {product.sellerLogo ? (
              <img
                src={product.sellerLogo}
                alt={product.seller}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(207, 181, 59, 0.2)' }}
              >
                <User className="w-5 h-5" style={{ color: '#191970' }} />
              </div>
            )}
            <div className="flex-1">
              <p>{product.seller}</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" style={{ color: '#cfb53b' }} fill="#cfb53b" />
                <span className="text-sm opacity-75">
                  {product.sellerRating} ({product.sellerReviews} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(25, 25, 112, 0.1)' }}
            >
              <Package className="w-5 h-5" style={{ color: '#191970' }} />
            </div>
            <div>
              <p className="text-sm opacity-75">Shipping</p>
              <p>{product.shipping}</p>
            </div>
          </div>

          {/* Condition */}
          <div className="mb-6">
            <h4 className="mb-2">Condition</h4>
            <p className="opacity-75">{product.condition}</p>
          </div>

          {/* Buy Now Button */}
          <button
            onClick={handleBuyNow}
            className="w-full py-4 rounded-lg transition-all"
            style={{
              backgroundColor: '#16193a',
              color: '#ffffff',
              border: '2px solid #cfb53b',
            }}
          >
            Buy Now
          </button>

          {/* Contact Seller Button */}
          <button
            onClick={handleContactSeller}
            className="w-full py-4 rounded-lg mt-3 transition-all"
            style={{
              backgroundColor: 'white',
              border: '2px solid #191970',
              color: '#191970',
            }}
          >
            Contact Seller
          </button>

          {/* Save Button */}
          {onFavorite && (
            <button
              onClick={handleFavorite}
              className="w-full py-4 rounded-lg mt-3 transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: isFavorited ? '#cfb53b' : 'white',
                border: '2px solid #cfb53b',
                color: isFavorited ? '#191970' : '#191970',
              }}
            >
              <GlintIcon
                size={20}
                color={isFavorited ? "#191970" : "#cfb53b"}
                filled={isFavorited}
                className="w-5 h-5"
              />
              <span>{isFavorited ? 'Saved' : 'Save This Find'}</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Message Modal */}
      <AnimatePresence>
        {showMessageModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
              onClick={() => setShowMessageModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-lg shadow-xl z-[70] p-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ color: '#191970' }}>Contact Seller</h3>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(25, 25, 112, 0.1)' }}
                >
                  <X className="w-4 h-4" style={{ color: '#191970' }} />
                </button>
              </div>

              {/* Product Info */}
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(25, 25, 112, 0.05)' }}>
                <p className="text-sm opacity-75 mb-1">About:</p>
                <p className="font-medium">{product.title}</p>
              </div>

              {/* Message Input */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a question about this item..."
                className="w-full p-3 rounded-lg mb-4 resize-none"
                style={{
                  border: '2px solid rgba(25, 25, 112, 0.2)',
                  minHeight: '120px',
                }}
                disabled={isSending}
              />

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isSending}
                className="w-full py-3 rounded-lg text-white transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: (!message.trim() || isSending) ? '#ccc' : '#191970',
                  border: '2px solid #cfb53b',
                  cursor: (!message.trim() || isSending) ? 'not-allowed' : 'pointer',
                }}
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Sending...' : 'Send Message'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}