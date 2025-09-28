import { AddProductComponent } from './components/admin/add-product/add-product';
import { CheckoutComponent } from './components/checkout/checkout';
import { LoginComponent } from './components/login/login';
import { OrderSuccessComponent } from './components/order-success/order-success';
import { ProductListComponent } from './components/product-list/product-list';
import { RegisterComponent } from './components/register/register';
import { AdminGuard } from './guards/admin.guard';
import { Routes } from '@angular/router';
  
export const routes: Routes = [
  { path: '', component: ProductListComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AddProductComponent, canActivate: [AdminGuard] },
   { path: 'checkout', component: CheckoutComponent },
   { path: 'order-success', component: OrderSuccessComponent },
   { path: 'register', component: RegisterComponent }, 
];