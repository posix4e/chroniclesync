import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, List, ListItem, ListItemText, IconButton, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface PeerManagerProps {
  clientId: string;
}

const PeerManager: React.FC<PeerManagerProps> = ({ clientId }) => {
  const [peers, setPeers] = useState<string[]>([]);
  const [newPeerId, setNewPeerId] = useState('');
  const [showSdpDialog, setShowSdpDialog] = useState(false);
  const [localSdp, setLocalSdp] = useState('');
  const [remoteSdp, setRemoteSdp] = useState('');
  const [selectedPeer, setSelectedPeer] = useState('');

  // Load peers from storage
  useEffect(() => {
    const loadPeers = async () => {
      const result = await chrome.storage.local.get(['knownPeers']);
      if (result.knownPeers) {
        setPeers(result.knownPeers);
      }
    };
    loadPeers();
  }, []);

  // Save peers to storage
  const savePeers = async (peerList: string[]) => {
    await chrome.storage.local.set({ knownPeers: peerList });
    setPeers(peerList);
  };

  const handleAddPeer = () => {
    if (newPeerId && !peers.includes(newPeerId)) {
      const newPeers = [...peers, newPeerId];
      savePeers(newPeers);
      setNewPeerId('');
    }
  };

  const handleRemovePeer = (peerId: string) => {
    const newPeers = peers.filter(p => p !== peerId);
    savePeers(newPeers);
  };

  const handleConnectToPeer = (peerId: string) => {
    setSelectedPeer(peerId);
    // In a real implementation, we would initiate the WebRTC connection here
    // and show the SDP information for manual exchange
    setShowSdpDialog(true);
    
    // Simulate generating an SDP offer
    setLocalSdp(JSON.stringify({
      type: 'offer',
      sdp: `v=0\no=- ${Date.now()} 2 IN IP4 127.0.0.1\ns=-\nt=0 0\na=group:BUNDLE 0\na=msid-semantic: WMS\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\nc=IN IP4 0.0.0.0\na=ice-ufrag:${Math.random().toString(36).substring(2, 8)}\na=ice-pwd:${Math.random().toString(36).substring(2, 15)}\na=ice-options:trickle\na=fingerprint:sha-256 ${Array(32).fill(0).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':')}\na=setup:actpass\na=mid:0\na=sctp-port:5000\na=max-message-size:262144\n`
    }, null, 2));
  };

  const handleCopyClientId = () => {
    navigator.clipboard.writeText(clientId);
  };

  const handleCopyLocalSdp = () => {
    navigator.clipboard.writeText(localSdp);
  };

  const handleProcessRemoteSdp = () => {
    // In a real implementation, we would process the remote SDP here
    // For now, we just close the dialog
    setShowSdpDialog(false);
    setRemoteSdp('');
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Peer Management
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Your Client ID
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            value={clientId}
            InputProps={{ readOnly: true }}
            size="small"
          />
          <IconButton onClick={handleCopyClientId} title="Copy Client ID">
            <ContentCopyIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Share your Client ID with other devices to establish direct connections.
        </Typography>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Known Peers
        </Typography>
        
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            fullWidth
            label="Peer ID"
            variant="outlined"
            value={newPeerId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPeerId(e.target.value)}
            size="small"
          />
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddPeer}
            sx={{ ml: 1 }}
          >
            Add
          </Button>
        </Box>
        
        <List>
          {peers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No peers added yet. Add a peer ID to get started.
            </Typography>
          ) : (
            peers.map((peer) => (
              <ListItem
                key={peer}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => handleRemovePeer(peer)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={peer} />
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => handleConnectToPeer(peer)}
                  sx={{ mr: 1 }}
                >
                  Connect
                </Button>
              </ListItem>
            ))
          )}
        </List>
      </Paper>
      
      <Dialog open={showSdpDialog} onClose={() => setShowSdpDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Connect to Peer: {selectedPeer}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Your SDP Offer (share this with the peer)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={8}
              variant="outlined"
              value={localSdp}
              InputProps={{ readOnly: true }}
            />
            <IconButton onClick={handleCopyLocalSdp} title="Copy SDP Offer">
              <ContentCopyIcon />
            </IconButton>
          </Box>
          
          <Typography variant="subtitle1" gutterBottom>
            Paste Peer&apos;s SDP Answer
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={8}
            variant="outlined"
            value={remoteSdp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemoteSdp(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSdpDialog(false)}>Cancel</Button>
          <Button onClick={handleProcessRemoteSdp} variant="contained">Process SDP</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PeerManager;