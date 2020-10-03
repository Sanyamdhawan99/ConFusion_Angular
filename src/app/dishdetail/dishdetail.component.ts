import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Dish } from '../shared/dish';
import { Comment } from '../shared/comment';
import { DishService } from '../services/dish.service';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss']
})
export class DishdetailComponent implements OnInit {

  commentForm: FormGroup;
  comment: Comment;
  dish: Dish;
  dishIds: string[];
  prev: string;
  next: string; 
  errMess: string;
  dishCopy: Dish;

  @ViewChild('cform') commentFormDirective;

  constructor(private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject('BaseUrl') private BaseUrl) {
      this.createForm();
    }

    formErrors = {
      'author': '',
      'comment': ''
    };
  
    validationMessages = {
      'author': {
        'required': 'Name is required.',
        'minlength': 'Name must be atleast 2 characters long.',
        'maxlength': 'Name cannot be more than 25 characters long.'
      },
      'comment': {
        'required': 'Comment is required.',
      },
    };
  
    createForm() {
      this.commentForm = this.fb.group({
        author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)]],
        rating: 5,
        comment: ['', Validators.required]
      });
      this.commentForm.valueChanges
        .subscribe(data => this.onValueChanged(data));
  
      this.onValueChanged(); // (re)set form validation messages
    }
  
    onValueChanged(data? : any) {
      if(!this.commentForm) { return; }
      const form = this.commentForm;
      for (const field in this.formErrors) {
        if (this.formErrors.hasOwnProperty(field)) {
          // clear previous error messages (if any)
          this.formErrors[field] = '';
          const control = form.get(field);
          if(control && control.dirty && !control.valid) {
            const messages = this.validationMessages[field];
            for (const key in control.errors) {
              if(control.errors.hasOwnProperty(key)) {
                this.formErrors[field] += messages[key] + ' ';
              }
            }
          }
        }
      }
    }
  
    onSubmit() {
      this.comment = this.commentForm.value;
      this.comment['date'] = new Date().toISOString();
      this.dishCopy.comments.push(this.comment);
      this.dishService.putDish(this.dishCopy)
        .subscribe(dish => {
          this.dish = dish;
          this.dishCopy = dish;
        },
        errmess => { this.dish = null; this.dishCopy = null; this.errMess = <any>errmess; });
      console.log(this.comment);
      this.commentFormDirective.resetForm();
      this.commentForm.reset({
        author: '',
        rating: 5,
        comment: ''
      });
    }
  
  ngOnInit() {
    this.dishService.getDishIds()
      .subscribe((dishIds) => this.dishIds = dishIds);
    this.route.params.pipe(switchMap((params: Params) => this.dishService.getDish(params['id'])))
      .subscribe((dish) => { this.dish = dish; this.dishCopy=dish; this.setPrevNext(dish.id) },
        errmess => this.errMess = <any> errmess);
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }

}
