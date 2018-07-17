import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { AnalyzeCommentResponse, SuggestCommentScoreResponse } from './perspectiveapi-types';
export declare class PerspectiveApiService {
    private http;
    private gapiClient;
    constructor(http: Http);
    initGapiClient(apiKey: string): void;
    checkText(text: string, sessionId: string, communityId: string, makeDirectApiCall: boolean, serverUrl?: string): Observable<AnalyzeCommentResponse>;
    suggestScore(text: string, sessionId: string, commentMarkedAsToxic: boolean, makeDirectApiCall: boolean, serverUrl?: string): Observable<SuggestCommentScoreResponse>;
}
