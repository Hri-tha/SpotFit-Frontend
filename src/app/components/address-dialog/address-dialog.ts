import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  MAT_DIALOG_DATA, 
  MatDialogRef, 
  MatDialogTitle, 
  MatDialogContent, 
  MatDialogActions, 
  MatDialogClose,
  MatDialogConfig 
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Address } from '../../models/address.model';

@Component({
  selector: 'app-address-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatRadioModule,
    MatCheckboxModule
  ],
  templateUrl: './address-dialog.html',
  styleUrls: ['./address-dialog.scss']
})
export class AddressDialogComponent implements OnInit {
  address: Address;
  isEdit: boolean;

  constructor(
    public dialogRef: MatDialogRef<AddressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { address?: Address, isEdit: boolean }
  ) {
    this.isEdit = data.isEdit;
    this.address = data.address || {
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      isDefault: false,
      type: 'home'
    };
  }

  ngOnInit() {
    // Configure dialog for mobile responsiveness
    this.configureDialogForMobile();
  }

  private configureDialogForMobile() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      const dialogConfig: MatDialogConfig = {
        maxWidth: '95vw',
        width: '95vw',
        height: 'auto',
        maxHeight: '90vh'
      };
      
      // Apply mobile configuration
      Object.keys(dialogConfig).forEach(key => {
        (this.dialogRef as any)[key] = (dialogConfig as any)[key];
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.isValidAddress()) {
      this.dialogRef.close(this.address);
    } else {
      alert('Please fill in all required fields');
    }
  }

  private isValidAddress(): boolean {
    return !!(
      this.address.fullName &&
      this.address.phone &&
      this.address.addressLine1 &&
      this.address.city &&
      this.address.state &&
      this.address.pincode &&
      this.address.country
    );
  }
}