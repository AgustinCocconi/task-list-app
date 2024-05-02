import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Network } from '@capacitor/network';
import { Storage } from '@capacitor/storage';
import { App, AppState } from '@capacitor/app';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class HomeService {
    private tasksSubject = new BehaviorSubject<any[]>([]);
    tasks$ = this.tasksSubject.asObservable();

    constructor(private snackBar: MatSnackBar) {
        this.loadTasks();

        Network.addListener('networkStatusChange', (status) => {
            this.syncTasks();
            if (status.connected) {
                this.snackBar.open('Conexión recuperada! Sincronizando tus datos', '', { duration: 3000 });
            } else {
                this.snackBar.open('No tienes internet! Guardaremos tus datos localmente y los sincronizaremos cuando la recuperes', '', { duration: 4000 });
            }
        });

        App.addListener('appStateChange', (state: AppState) => {
            if (state.isActive) {
                this.syncTasks();
            }
        });
    }

    async saveTasksToLocal() {
        await Storage.set({
            key: 'tasks',
            value: JSON.stringify(this.tasksSubject.value)
        });
    }

    async loadTasks() {
        const status = await Network.getStatus();
        if (status.connected) {
            this.loadTasksFromServer();
        } else {
            this.loadTasksFromLocal();
        }
    }

    async loadTasksFromServer() {
        try {
            // fake API call, will still use local storage to load tasks
            const response = await fetch('https://jsonplaceholder.typicode.com/posts');
            const data = await response.json();
            this.loadTasksFromLocal();
        } catch (error) {
            console.error(error);
            this.loadTasksFromLocal();
        }
    }

    async loadTasksFromLocal() {
        const tasks = await Storage.get({ key: 'tasks' });
        const parsedTasks = JSON.parse(tasks.value || '[]');
        this.tasksSubject.next(parsedTasks);
    }

    async syncTasks() {
        const status = await Network.getStatus();
        if (status.connected) {
            try {
                this.saveTasksToServer();

                // After syncing, clear the tasks from local storage:
                await Storage.remove({ key: 'tasks' });
            } catch (error) {
                console.error(error);
                this.saveTasksToLocal();
            }
        } else {
            // Save tasks to local storage
            this.saveTasksToLocal();
        }
    }

    async saveTasksToServer() {
        try {
            // fake API call, will still use local storage to save tasks
            const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                body: JSON.stringify(this.tasksSubject.value),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
            });
            const data = await response.json();

            this.saveTasksToLocal();
            // After syncing, clear the tasks from local storage:
            // await Storage.remove({ key: 'tasks' });
        } catch (error) {
            console.error(error);
            this.saveTasksToLocal();
        }
    }

    addTask(task: any) {
        const updatedTasks = [...this.tasksSubject.value, task];
        this.tasksSubject.next(updatedTasks);
        this.syncTasks();
    }

    deleteTask(taskId: number) {
        const updatedTasks = this.tasksSubject.value.filter(task => task.id !== taskId);
        this.tasksSubject.next(updatedTasks);
        this.syncTasks();
    }

    saveTask(task: any) {
        const updatedTasks = this.tasksSubject.value.map(t => t.id === task.id ? task : t);
        this.tasksSubject.next(updatedTasks);
        this.syncTasks();
    }

    updateTasks(tasks: Task[]) {
        this.tasksSubject.next(tasks);
        this.syncTasks();
    }
}