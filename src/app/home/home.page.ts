import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { take } from 'rxjs';
import { Task } from './home.interface';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { HomeService } from './home.service';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }
  ],
  imports: [IonContent, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, CommonModule, MatListModule, ReactiveFormsModule, DragDropModule],
})
export class HomePage {
  @ViewChild('editInput', { static: false }) editInput!: ElementRef;

  taskForm = new FormGroup({
    newTask: new FormControl('', Validators.required),
  });
  tasks$ = this.homeService.tasks$;

  editTaskId: number | null = null;
  editTaskForm = new FormGroup({
    editTaskName: new FormControl('', Validators.required),
  });
  constructor(
    private homeService: HomeService,
  ) { }

  addTask() {
    if (this.taskForm.invalid) {
      this.taskForm.get('newTask')?.markAsTouched();
      return;
    }
    const taskName = this.taskForm.get('newTask')?.value!;
    const newTask: Task = { id: Date.now(), name: taskName };
    this.homeService.addTask(newTask);
    this.taskForm.reset();
  }

  deleteTask(taskId: number) {
    this.homeService.deleteTask(taskId);
  }

  editTask(task: Task) {
    this.editTaskForm.get('editTaskName')?.setValue(task.name);
    this.editTaskId = task.id;
    setTimeout(() => {
      this.editInput.nativeElement.focus();
    }, 0);
  }

  saveTask() {
    if (this.editTaskForm.invalid) return;
    const updatedTask = {
      id: this.editTaskId,
      name: this.editTaskForm.get('editTaskName')?.value!
    };
    this.homeService.saveTask(updatedTask);
    this.editTaskId = null;
    this.editTaskForm.reset();
  }

  drop(event: CdkDragDrop<string[]>) {
    this.homeService.tasks$.pipe(take(1)).subscribe(tasks => {
      moveItemInArray(tasks, event.previousIndex, event.currentIndex);
      this.homeService.updateTasks(tasks);
    });
  }
}