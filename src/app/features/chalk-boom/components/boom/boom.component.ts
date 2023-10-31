import { NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Boom } from 'src/app/models/boom.model';

@Component({
  selector: 'app-boom',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './boom.component.html',
  styleUrls: ['./boom.component.scss'],
})
export class BoomComponent {
  @Input() boom!: Boom;
}
