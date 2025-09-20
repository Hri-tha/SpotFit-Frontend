import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressDialog } from './address-dialog';

describe('AddressDialog', () => {
  let component: AddressDialog;
  let fixture: ComponentFixture<AddressDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddressDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddressDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
