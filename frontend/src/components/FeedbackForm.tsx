import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function FeedbackForm({ shipmentId, trackingNumber, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API_URL}/feedbacks`, {
        shipmentId,
        customerName: 'Customer',
        customerPhone: '0712345678',
        rating,
        comment,
      });
      alert('Thank you for your feedback!');
      onSuccess();
    } catch (error) {
      alert('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '400px', zIndex: 1000 }}>
      <h3>Rate Your Delivery Experience</h3>
      <p>Tracking: {trackingNumber}</p>
      <div style={{ marginBottom: '16px' }}>
        <label>Rating: {rating} stars</label>
        <input type="range" min="1" max="5" value={rating} onChange={(e) => setRating(parseInt(e.target.value))} />
      </div>
      <textarea placeholder="Share your experience..." value={comment} onChange={(e) => setComment(e.target.value)} rows={4} style={{ width: '100%', marginBottom: '16px' }} />
      <button onClick={handleSubmit} disabled={loading}>Submit Feedback</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
}

export default FeedbackForm;
