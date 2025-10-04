import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image: string;
}

interface Order {
  _id: string;
  orderId: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  waybillNumber?: string;
  trackingUrl?: string;
  expectedDelivery?: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order.html',
  styleUrls: ['./order.scss']
})
export class OrderComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  isLoading: boolean = true;
  error: string = '';
  expandedOrderId: string | null = null; // Track which order is expanded
  private refreshInterval: any;
  currentUser: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loadOrders();
    });

    this.refreshInterval = setInterval(() => {
      this.loadOrders();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadOrders() {
    this.isLoading = true;
    const userEmail = this.currentUser?.email;
    
    if (!userEmail) {
      this.error = 'Please login to view your orders';
      this.isLoading = false;
      return;
    }

    this.http.get<{success: boolean, data: {orders: Order[]}}>(
      `${environment.apiUrl}/orders/user/${userEmail}`
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.orders = response.data.orders;
          this.error = '';
        } else {
          this.error = 'Failed to load orders';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load orders:', error);
        this.http.get<Order[]>(`${environment.apiUrl}/orders/user-orders?email=${userEmail}`)
          .subscribe({
            next: (orders) => {
              this.orders = orders;
              this.isLoading = false;
              this.error = '';
            },
            error: (fallbackError) => {
              this.error = 'Failed to load orders. Please try again.';
              this.isLoading = false;
            }
          });
      }
    });
  }

  // Toggle order details view
  toggleOrderDetails(orderId: string) {
    if (this.expandedOrderId === orderId) {
      this.expandedOrderId = null; // Collapse if already expanded
    } else {
      this.expandedOrderId = orderId; // Expand this order
    }
  }

  // Check if order is expanded
  isOrderExpanded(orderId: string): boolean {
    return this.expandedOrderId === orderId;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'delivered': return 'status-delivered';
      case 'shipped': return 'status-shipped';
      case 'confirmed': 
      case 'paid': return 'status-confirmed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Order Placed';
      case 'paid': 
      case 'confirmed': return 'Confirmed';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  trackOrder(waybillNumber: string) {
    if (waybillNumber) {
      window.open(`https://track.delhivery.com/#/track/${waybillNumber}`, '_blank');
    }
  }

  // Navigate to detailed order page
  viewOrderDetails(orderId: string) {
    this.router.navigate(['/order-details', orderId]);
  }

  cancelOrder(orderId: string) {
    if (confirm('Are you sure you want to cancel this order?')) {
      this.http.post(`${environment.apiUrl}/orders/${orderId}/cancel`, {})
        .subscribe({
          next: () => {
            this.loadOrders();
          },
          error: (error) => {
            console.error('Failed to cancel order:', error);
            alert('Failed to cancel order. Please try again.');
          }
        });
    }
  }

  continueShopping() {
    this.router.navigate(['/']);
  }

  getTotalItems(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // Get first product name for summary view
  getFirstProductName(order: Order): string {
    return order.items.length > 0 ? order.items[0].name : 'Product';
  }

  // Get total items count for summary
  getTotalItemsCount(order: Order): number {
    return this.getTotalItems(order);
  }
}