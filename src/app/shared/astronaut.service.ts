import { Space, Team, ProcessTemplate, SpaceAttributes } from 'ngx-fabric8-wit';
import { Observer } from 'rxjs/Observer';
import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs';

import { cloneDeep } from 'lodash';
import {
  Broadcaster,
  Logger,
  User
} from 'ngx-login-client';

import { MockDataService } from './mock-data.service';
import { SpaceMockGenerator } from './mock-data/space-mock-generator';
import { MockHttp } from './mock-http';
import { GlobalSettings } from './globals';

@Injectable()
export class AstronautService {

  constructor(
    private http: Http,
    private mockDataService: MockDataService,
    private logger: Logger,
    private globalSettings: GlobalSettings,
    private broadcaster: Broadcaster
  ) { }

  // We don't really need this in planner
  // We are using it just to mock the header with list of spaces
  getAllSpaces(): Observable<Space[]> {
    if (this.globalSettings.isTestmode()) {
      this.logger.log('SpaceService running in ' + process.env.ENV + ' mode.');
      let spaces = this.createSpacesFromServiceResponse(this.mockDataService.getAllSpaces());
      this.logger.log('Initialized spaces from inmemory.');
      return Observable.of(spaces);
    } else {
      this.logger.log('SpaceService running in production mode.');
      // TODO:  this is the base URL slightly to be changed
      let url = process.env.API_URL + 'spaces';
      let observable = this.http
        .get(url)
        .map(resp => {
          let spaces = this.createSpacesFromServiceResponse(resp.json().data);
          this.logger.log('Initialized spaces from server.');
          return spaces;
        });
      return observable;
    }
  }

  private createSpacesFromServiceResponse(response: any): Space[] {
    let result: Space[] = [];
    for (let i = 0; i < response.length; i++) {
      let thisElem = response[i];
      let thisTeam: Team = {
        name: 'Team ' + thisElem.attributes.name,
        members: [this.mockDataService.getUser()]
      } as Team;
      let thisSpace: Space = {
        name: thisElem.attributes.name,
        path: '',
        description: '',
        teams: [thisTeam],
        defaultTeam: thisTeam,
        process: new ProcessTemplate(),
        privateSpace: false,
        id: thisElem.id,
        attributes: new SpaceAttributes(),
        type: thisElem.type,
        links: {
          self: process.env.API_URL
        },
        // FIXME: refactor the mock data service to return the same model as on the live service, the refactor here
        relationships: {
          areas: {
            links: {
              related: process.env.API_URL + '/areas'
            }
          },
          iterations: {
            links: {
              related: thisElem.relationships.iterations.links.related
            }
          }
        }
      } as Space;
      result.push(thisSpace);
    }
    return result;
  }

  private handleError(error: any): Promise<any> {
    this.logger.error(error);
    return Promise.reject(error.message || error);
  }
}